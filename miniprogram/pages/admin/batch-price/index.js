const api = require('../../../utils/api')

Page({
  data: {
    showConfirm: false,
    selectedCount: 2,
    processes: [
      { id: 'cut', name: '裁剪', oldPrice: '¥0.40', newPrice: '0.45', selected: true },
      { id: 'sew', name: '缝合', oldPrice: '¥0.60', newPrice: '0.68', selected: true },
      { id: 'iron', name: '烫熨', oldPrice: '¥0.35', newPrice: '', selected: false },
      { id: 'check', name: '质检', oldPrice: '¥0.35', newPrice: '', selected: false }
    ]
  },

  onLoad() {
    this.loadProcesses()
  },

  onShow() {
    this.loadProcesses()
  },

  toggleProcess(event) {
    const { id } = event.currentTarget.dataset
    const processes = this.data.processes.map((item) => item.id === id ? { ...item, selected: !item.selected } : item)
    this.setData({
      processes,
      selectedCount: processes.filter((item) => item.selected).length
    })
  },

  changePrice(event) {
    const { id } = event.currentTarget.dataset
    const { value } = event.detail
    const processes = this.data.processes.map((item) => item.id === id ? { ...item, newPrice: value } : item)
    this.setData({ processes })
  },

  openConfirm() {
    if (this.data.selectedCount === 0) {
      wx.showToast({ title: '请先选择工序', icon: 'none' })
      return
    }

    this.createAdjustment()
  },

  closeConfirm() {
    this.setData({ showConfirm: false })
  },

  confirmAdjust() {
    this.setData({ showConfirm: false })
    this.createAdjustment()
  },

  loadProcesses() {
    api.getProcesses().then((processes) => {
      if (!Array.isArray(processes) || processes.length === 0) {
        return
      }

      this.setData({
        processes: processes.map((item, index) => ({
          id: item.id,
          name: item.name,
          oldPrice: this.formatAmount(item.priceCents),
          newPrice: (Number(item.priceCents || 0) / 100).toFixed(2),
          selected: index < 2
        })),
        selectedCount: Math.min(2, processes.length)
      })
    }).catch(() => {})
  },

  createAdjustment() {
    const items = this.data.processes
      .filter((item) => item.selected)
      .map((item) => ({
        processId: item.id,
        newPriceCents: Math.round(Number(item.newPrice || 0) * 100)
      }))

    api.createPriceAdjustment(items).then((adjustment) => {
      wx.navigateTo({
        url: `/pages/batch-price-confirm/index?id=${adjustment.id}`
      })
    }).catch(() => {
      wx.showToast({ title: '调价接口不可用', icon: 'none' })
    })
  },

  formatAmount(cents) {
    return `¥${(Number(cents || 0) / 100).toFixed(2)}`
  }
})
