const { syncTabBar } = require('../../utils/tabbar')

Page({
  data: {
    showGuide: false,
    guideShownOnce: false,
    guideSteps: [
      {
        title: '选择报工方式',
        desc: '单工序适合临时报工，工艺路线适合同一产品连续多道工序。',
        spotStyle: 'top: 150rpx; left: 28rpx; width: 694rpx; height: 166rpx;'
      },
      {
        title: '可一次添加多道工序',
        desc: '选中的工序会出现在明细表里，数量可以逐项加减，金额会自动合计。',
        spotStyle: 'top: 340rpx; left: 28rpx; width: 694rpx; height: 280rpx;',
        panelClass: 'panel-top-pos'
      },
      {
        title: '提交前补充凭证',
        desc: '备注和现场图片能减少审核沟通，数量异常时系统会先弹出确认。',
        spotStyle: 'top: 650rpx; left: 28rpx; width: 694rpx; height: 310rpx;',
        panelClass: 'panel-top-pos'
      }
    ],
    showQuantityWarning: false,
    showProcessPicker: false,
    selectedMode: 'process',
    selectedProcessId: 'quality',
    selectedProcessName: '产品质检',
    totalAmount: '¥ 35.50',
    processOptions: [
      { id: 'quality', name: '产品质检', priceCents: 35, price: '¥0.35', selected: true },
      { id: 'assembly', name: '零件装配', priceCents: 30, price: '¥0.30', selected: false },
      { id: 'drill', name: '钻孔', priceCents: 50, price: '¥0.50', selected: false },
      { id: 'cutting', name: '切割', priceCents: 40, price: '¥0.40', selected: false },
      { id: 'package', name: '包装检验', priceCents: 20, price: '¥0.20', selected: false }
    ],
    processes: [
      { id: 'quality', name: '产品质检', priceCents: 35, price: '¥0.35', quantity: 30, subtotal: '¥10.50' },
      { id: 'assembly', name: '零件装配', priceCents: 30, price: '¥0.30', quantity: 50, subtotal: '¥15.00' },
      { id: 'drill', name: '钻孔', priceCents: 50, price: '¥0.50', quantity: 20, subtotal: '¥10.00' }
    ]
  },

  onShow() {
    syncTabBar(2, { hidden: true })
    this.setData({
      selectedMode: 'process'
    })
    this.refreshDerivedData()
    this.showGuideIfNeeded()
  },

  selectProcessMode() {
    this.setData({
      selectedMode: 'process'
    })
  },

  selectRouteMode() {
    this.setData({
      selectedMode: 'route'
    })

    wx.navigateTo({
      url: '/pages/report-route/index'
    })
  },

  toggleProcessPicker() {
    this.setData({
      showProcessPicker: !this.data.showProcessPicker
    })
  },

  closeProcessPicker() {
    this.setData({
      showProcessPicker: false
    })
  },

  selectProcess(event) {
    const { id } = event.currentTarget.dataset
    const option = this.data.processOptions.find((item) => item.id === id)

    if (!option) {
      return
    }

    const processes = this.data.processes.slice()
    const existedIndex = processes.findIndex((item) => item.id === id)

    if (existedIndex === -1) {
      processes.push(this.buildProcess(option, 1))
    }

    this.setData({
      selectedProcessId: id,
      selectedProcessName: option.name,
      showProcessPicker: false,
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
      selectedProcessName
    })
    this.refreshDerivedData()

    wx.showToast({
      title: '已删除',
      icon: 'none'
    })
  },

  goRouteReport() {
    wx.navigateTo({
      url: '/pages/report-route/index'
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
    wx.navigateTo({
      url: '/pages/submit-success/index'
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
      subtotal: this.formatAmount(subtotalCents)
    }
  },

  refreshDerivedData() {
    const selectedProcessId = this.data.selectedProcessId
    const processOptions = this.data.processOptions.map((item) => ({
      ...item,
      selected: item.id === selectedProcessId
    }))
    const totalCents = this.data.processes.reduce((sum, item) => {
      return sum + Number(item.priceCents) * Number(item.quantity)
    }, 0)

    this.setData({
      processOptions,
      totalAmount: this.formatAmount(totalCents, true)
    })
  },

  formatAmount(cents, withSpace) {
    const prefix = withSpace ? '¥ ' : '¥'
    return `${prefix}${(Number(cents) / 100).toFixed(2)}`
  }
})
