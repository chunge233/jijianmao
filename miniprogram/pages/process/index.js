Page({
  data: {
    processes: [
      { name: '裁剪工序', category: '裁剪', price: '¥0.50/件' },
      { name: '缝合工序', category: '缝纫', price: '¥0.80/件' },
      { name: '质检工序', category: '质检', price: '¥0.30/件' },
      { name: '包装工序', category: '包装', price: '¥0.25/件' },
      { name: '烫熨工序', category: '熨烫', price: '¥0.40/件' }
    ]
  },

  goNewProcess() {
    wx.navigateTo({
      url: '/pages/process-new/index'
    })
  },

  openProcessDetail() {
    wx.navigateTo({
      url: '/pages/process-detail/index'
    })
  },

  openDeleteConfirm() {
    wx.navigateTo({
      url: '/pages/delete-confirm/index'
    })
  }
})
