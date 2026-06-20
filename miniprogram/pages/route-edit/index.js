const api = require('../../utils/api')

Page({
  data: {
    routeId: '',
    name: '',
    processes: [],
    selectedProcessIds: [],
    saving: false
  },

  onLoad(options) {
    const routeId = (options && options.id) || ''
    this.setData({ routeId })
    this.loadData(routeId)
  },

  loadData(routeId) {
    const routeRequest = routeId ? api.getRoute(routeId) : Promise.resolve(null)

    Promise.all([
      api.getProcesses(),
      routeRequest
    ]).then(([processes, route]) => {
      const selectedProcessIds = route && Array.isArray(route.processes)
        ? route.processes.map((item) => item.id)
        : []

      this.setData({
        name: route ? route.name : '',
        selectedProcessIds,
        processes: (Array.isArray(processes) ? processes : [])
          .filter((item) => item.status !== 'disabled')
          .map((item) => ({
            ...item,
            checked: selectedProcessIds.includes(item.id),
            priceText: `¥${(Number(item.priceCents || 0) / 100).toFixed(2)}/件`
          }))
      })
    }).catch(() => {})
  },

  onNameInput(event) {
    this.setData({ name: event.detail.value || '' })
  },

  onProcessChange(event) {
    const selectedProcessIds = event.detail.value || []
    this.setData({
      selectedProcessIds,
      processes: this.data.processes.map((item) => ({
        ...item,
        checked: selectedProcessIds.includes(item.id)
      }))
    })
  },

  saveRoute() {
    const name = this.data.name.trim()
    const processIds = this.data.selectedProcessIds

    if (!name) {
      wx.showToast({ title: '请输入路线名称', icon: 'none' })
      return
    }

    if (!processIds.length) {
      wx.showToast({ title: '请选择至少一道工序', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    const payload = { name, processIds }
    const request = this.data.routeId
      ? api.updateRoute(this.data.routeId, payload)
      : api.createRoute(payload)

    request.then(() => {
      this.setData({ saving: false })
      wx.showToast({ title: '路线已保存', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 450)
    }).catch((error) => {
      this.setData({ saving: false })
      wx.showToast({ title: error.message || '保存失败', icon: 'none' })
    })
  }
})
