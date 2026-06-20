const { syncTabBar } = require('../../utils/tabbar')
const api = require('../../utils/api')
const { ensureFactorySelected } = require('../../utils/session')

Page({
  data: {
    showGuide: false,
    guideShownOnce: false,
    guideSteps: [
      {
        title: '选择报工对象',
        desc: '工序和工艺路线都在当前页面选择，扫码后也会直接回到这里。',
        spotStyle: 'top: 150rpx; left: 28rpx; width: 694rpx; height: 260rpx;'
      },
      {
        title: '核对计件明细',
        desc: '工序码会选中单道工序，路线码会带出路线下所有工序。',
        spotStyle: 'top: 430rpx; left: 28rpx; width: 694rpx; height: 280rpx;',
        panelClass: 'panel-top-pos'
      },
      {
        title: '提交前补充凭证',
        desc: '备注和现场图片能减少审核沟通，数量异常时系统会先弹出确认。',
        spotStyle: 'top: 740rpx; left: 28rpx; width: 694rpx; height: 310rpx;',
        panelClass: 'panel-top-pos'
      }
    ],
    showQuantityWarning: false,
    showPicker: false,
    pickerMode: 'process',
    selectedMode: 'process',
    selectedProcessId: '',
    selectedProcessName: '已选择 3 道工序',
    selectedRouteId: '',
    selectedRouteName: '',
    selectedSource: 'manual',
    scanNotice: '',
    selectionTitle: '请选择计件工序',
    selectionDesc: '可从底部弹窗添加工序',
    totalAmount: '¥ 0.00',
    processCountText: '0 道工序',
    totalQuantityText: '0 件',
    remark: '',
    processOptions: [],
    routeOptions: [],
    processes: []
  },

  onLoad(options) {
    this.reportOptions = options || {}
    this.reportOptionsLoaded = false
  },

  onShow() {
    ensureFactorySelected().then((ready) => {
      if (!ready) {
        return
      }

      syncTabBar(2, { hidden: true })

      const options = this.reportOptionsLoaded ? {} : (this.reportOptions || {})
      this.reportOptionsLoaded = true
      this.refreshDerivedData()
      this.loadReportOptions(options)

      this.showGuideIfNeeded()
    })
  },

  selectProcessMode() {
    this.setData({
      selectedMode: 'process',
      pickerMode: 'process',
      selectedRouteId: '',
      selectedRouteName: '',
      selectedSource: 'manual',
      scanNotice: '',
      showPicker: true
    })
    this.refreshDerivedData()
  },

  loadReportOptions(options) {
    Promise.all([
      api.getProcesses(),
      api.getRoutes()
    ]).then(([processes, routes]) => {
      const processOptions = processes.map((item) => ({
        id: item.id,
        name: item.name,
        priceCents: Number(item.priceCents),
        price: this.formatAmount(item.priceCents),
        qrLabel: item.qrCode,
        defaultQuantity: 1,
        selected: false
      }))
      const routeOptions = routes.map((item) => {
        const steps = (item.processes || []).filter(Boolean).map((process) => ({
          id: process.id,
          name: process.name,
          priceCents: Number(process.priceCents),
          price: this.formatAmount(process.priceCents),
          quantity: 1
        }))

        return {
          id: item.id,
          name: item.name,
          qrLabel: item.qrCode,
          desc: steps.map((step) => step.name).join(' -> '),
          steps,
          selected: false
        }
      })

      this.setData({
        processOptions,
        routeOptions
      })
      this.applyQrOptions(options || {})
      this.refreshDerivedData()
    }).catch(() => {
      this.refreshDerivedData()
    })
  },

  selectRouteMode() {
    this.setData({
      selectedMode: 'route',
      pickerMode: 'route',
      showPicker: true
    })
    this.refreshDerivedData()
  },

  openSelectionPicker() {
    this.setData({
      pickerMode: this.data.selectedMode,
      showPicker: true
    })
  },

  closePicker() {
    this.setData({
      showPicker: false
    })
  },

  noop() {},

  selectProcess(event) {
    const { id } = event.currentTarget.dataset
    const option = this.getProcessById(id)

    if (!option) {
      return
    }

    this.applyProcessSelection(option, {
      replace: !!this.data.selectedRouteId,
      source: 'manual'
    })
  },

  selectRoute(event) {
    const { id } = event.currentTarget.dataset
    const route = this.getRouteById(id)

    if (!route) {
      return
    }

    this.applyRouteSelection(route, 'manual')
  },

  applyQrOptions(options) {
    const qrType = options.qrType || options.type

    if (qrType === 'route') {
      const route = this.getRouteById(options.routeId || options.routeCode)
      if (!route && (options.routeId || options.routeCode)) {
        wx.showToast({ title: '未找到工艺路线', icon: 'none' })
      }
      this.applyRouteSelection(route, 'route-qr')
      return
    }

    if (qrType === 'process') {
      const process = this.getProcessById(options.processId || options.processCode)
      if (!process && (options.processId || options.processCode)) {
        wx.showToast({ title: '未找到工序', icon: 'none' })
      }
      this.applyProcessSelection(process, {
        replace: true,
        source: 'process-qr'
      })
    }
  },

  applyProcessSelection(option, config) {
    if (!option) {
      return
    }

    const replace = config && config.replace
    const source = (config && config.source) || 'manual'
    const processes = replace ? [] : this.data.processes.slice()
    const existedIndex = processes.findIndex((item) => item.id === option.id)

    if (existedIndex === -1) {
      processes.push(this.buildProcess(option, option.defaultQuantity || 1))
    } else if (replace) {
      processes[0] = this.buildProcess(option, option.defaultQuantity || processes[existedIndex].quantity || 1)
    }

    this.setData({
      selectedMode: 'process',
      pickerMode: 'process',
      selectedProcessId: option.id,
      selectedProcessName: option.name,
      selectedRouteId: '',
      selectedRouteName: '',
      selectedSource: source,
      scanNotice: source === 'process-qr' ? `已识别工序二维码 ${option.qrLabel}，自动选中「${option.name}」。` : '',
      showPicker: false,
      processes
    })
    this.refreshDerivedData()
  },

  onRemarkInput(event) {
    this.setData({
      remark: event.detail.value
    })
  },

  applyRouteSelection(route, source) {
    if (!route) {
      return
    }

    const processes = route.steps.map((step) => this.buildProcess(step, step.quantity || 1))

    this.setData({
      selectedMode: 'route',
      pickerMode: 'route',
      selectedProcessId: '',
      selectedProcessName: route.name,
      selectedRouteId: route.id,
      selectedRouteName: route.name,
      selectedSource: source || 'manual',
      scanNotice: source === 'route-qr' ? `已识别工艺路线二维码 ${route.qrLabel}，已带出该路线全部工序。` : '',
      showPicker: false,
      processes
    })
    this.refreshDerivedData()
  },

  decreaseQuantity(event) {
    const index = Number(event.currentTarget.dataset.index)
    const processes = this.data.processes.slice()
    const current = processes[index]

    if (!current) {
      return
    }

    if (current.quantity <= 1) {
      wx.showToast({
        title: '数量不能小于1',
        icon: 'none'
      })
      return
    }

    processes[index] = this.buildProcess(current, current.quantity - 1)
    this.setData({ processes })
    this.refreshDerivedData()
  },

  increaseQuantity(event) {
    const index = Number(event.currentTarget.dataset.index)
    const processes = this.data.processes.slice()
    const current = processes[index]

    if (!current) {
      return
    }

    processes[index] = this.buildProcess(current, current.quantity + 1)
    this.setData({ processes })
    this.refreshDerivedData()
  },

  removeProcess(event) {
    const index = Number(event.currentTarget.dataset.index)
    const processes = this.data.processes.slice()
    const removed = processes.splice(index, 1)[0]
    const selectedProcessId = removed && removed.id === this.data.selectedProcessId
      ? (processes[0] ? processes[0].id : '')
      : this.data.selectedProcessId
    const selectedProcessName = selectedProcessId
      ? (processes.find((item) => item.id === selectedProcessId) || {}).name || this.data.selectedProcessName
      : '请选择计件工序'

    this.setData({
      processes,
      selectedProcessId,
      selectedProcessName,
      selectedSource: 'manual',
      scanNotice: '',
      selectedRouteId: this.data.selectedMode === 'route' ? '' : this.data.selectedRouteId,
      selectedRouteName: this.data.selectedMode === 'route' ? '' : this.data.selectedRouteName,
      selectedMode: this.data.selectedMode === 'route' ? 'process' : this.data.selectedMode
    })
    this.refreshDerivedData()

    wx.showToast({
      title: '已删除',
      icon: 'none'
    })
  },

  goSuccess() {
    if (this.data.processes.length === 0) {
      wx.showToast({
        title: '请先选择工序',
        icon: 'none'
      })
      return
    }

    if (this.data.selectedMode === 'route' && !this.data.selectedRouteId) {
      wx.showToast({
        title: '请先选择工艺路线',
        icon: 'none'
      })
      return
    }

    const abnormal = this.data.processes.some((item) => Number(item.quantity) >= 120)

    if (abnormal) {
      this.setData({
        showQuantityWarning: true
      })
      return
    }

    this.submitReport()
  },

  cancelAbnormalSubmit() {
    this.setData({
      showQuantityWarning: false
    })
  },

  confirmAbnormalSubmit() {
    this.setData({
      showQuantityWarning: false
    })
    this.submitReport()
  },

  submitReport() {
    const processCount = this.data.processes.length
    const quantity = this.getTotalQuantity()
    const totalCents = this.getTotalCents()
    const type = this.data.selectedMode === 'route' ? '工艺路线' : '单工序'
    const reportType = this.data.selectedMode === 'route' ? 'route' : 'process'
    const payload = {
      type: reportType,
      remark: this.data.remark.trim(),
      items: this.data.processes.map((item) => ({
        processId: item.id,
        quantity: Number(item.quantity),
        priceCents: Number(item.priceCents),
        processName: item.name
      }))
    }

    api.createReport(payload).then((report) => {
      wx.navigateTo({
        url: `/pages/submit-success/index?type=${encodeURIComponent(type)}&processCount=${report.items.length || processCount}&quantity=${report.quantity || quantity}&amount=${((report.totalCents || totalCents) / 100).toFixed(2)}`
      })
    }).catch((error) => {
      wx.showToast({
        title: error.message || '提交失败，请检查网络',
        icon: 'none'
      })
    })
  },

  showGuideIfNeeded() {
    if (this.data.guideShownOnce || wx.getStorageSync('guide_report_v1')) {
      return
    }

    this.setData({
      showGuide: true,
      guideShownOnce: true
    })
  },

  closeGuide() {
    this.setData({
      showGuide: false
    })
  },

  neverGuide() {
    this.setData({
      showGuide: false,
      guideShownOnce: true
    })
  },

  buildProcess(process, quantity) {
    const priceCents = Number(process.priceCents)
    const nextQuantity = Number(quantity)
    const subtotalCents = priceCents * nextQuantity

    return {
      id: process.id,
      name: process.name,
      priceCents,
      price: process.price || this.formatAmount(priceCents),
      quantity: nextQuantity,
      subtotal: this.formatAmount(subtotalCents),
      qrLabel: process.qrLabel || '',
      terminal: !!process.terminal
    }
  },

  refreshDerivedData() {
    const processes = this.data.processes
    const selectedProcessIds = processes.map((item) => item.id)
    const selectedRouteId = this.data.selectedRouteId
    const processOptions = this.data.processOptions.map((item) => ({
      ...item,
      selected: selectedProcessIds.includes(item.id)
    }))
    const routeOptions = this.data.routeOptions.map((item) => ({
      ...item,
      selected: item.id === selectedRouteId
    }))
    const totalCents = this.getTotalCents()
    const totalQuantity = this.getTotalQuantity()
    const isRoute = this.data.selectedMode === 'route'
    const selectedRoute = isRoute ? this.getRouteById(selectedRouteId) : null
    const selectionTitle = isRoute
      ? (this.data.selectedRouteName || '请选择工艺路线')
      : (processes.length ? `已选择 ${processes.length} 道工序` : '请选择计件工序')
    const selectionDesc = isRoute
      ? (selectedRoute ? `${selectedRoute.desc} · ${selectedRoute.qrLabel}` : '从底部弹窗选择工艺路线')
      : (this.data.selectedSource === 'process-qr'
        ? '工序二维码已识别，可继续调整数量'
        : '可从底部弹窗添加工序')

    this.setData({
      processOptions,
      routeOptions,
      selectionTitle,
      selectionDesc,
      totalAmount: this.formatAmount(totalCents, true),
      processCountText: `${processes.length} 道工序`,
      totalQuantityText: `${totalQuantity} 件`
    })
  },

  getProcessById(id) {
    return this.data.processOptions.find((item) => item.id === id || item.qrLabel === id)
  },

  getRouteById(id) {
    return this.data.routeOptions.find((item) => item.id === id || item.qrLabel === id)
  },

  getTotalQuantity() {
    return this.data.processes.reduce((sum, item) => sum + Number(item.quantity), 0)
  },

  getTotalCents() {
    return this.data.processes.reduce((sum, item) => {
      return sum + Number(item.priceCents) * Number(item.quantity)
    }, 0)
  },

  formatAmount(cents, withSpace) {
    const prefix = withSpace ? '¥ ' : '¥'
    return `${prefix}${(Number(cents) / 100).toFixed(2)}`
  }
})
