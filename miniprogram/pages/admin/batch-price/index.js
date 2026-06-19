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

    wx.navigateTo({
      url: '/pages/batch-price-confirm/index'
    })
  },

  closeConfirm() {
    this.setData({ showConfirm: false })
  },

  confirmAdjust() {
    this.setData({ showConfirm: false })
    wx.navigateTo({
      url: '/pages/batch-price-confirm/index'
    })
  }
})
