const api = require('../../utils/api')

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

  onLoad() {
    this.loadProcesses()
  },

  onShow() {
    this.loadProcesses()
  },

  loadProcesses() {
    api.getProcesses().then((processes) => {
      if (!Array.isArray(processes) || processes.length === 0) {
        return
      }

      this.setData({
        processes: processes.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.qrCode || '计件工序',
          price: `¥${(Number(item.priceCents) / 100).toFixed(2)}/件`
        }))
      })
    }).catch(() => {})
  },

  goNewProcess(event) {
    const id = event && event.currentTarget && event.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/process-new/index${id ? `?id=${id}` : ''}`
    })
  },

  openProcessDetail(event) {
    const { id } = event.currentTarget.dataset

    wx.navigateTo({
      url: `/pages/process-detail/index${id ? `?id=${id}` : ''}`
    })
  },

  openDeleteConfirm(event) {
    const { id } = event.currentTarget.dataset

    wx.showModal({
      title: '停用工序？',
      content: '停用后员工端将不能继续选择该工序报工。',
      confirmText: '停用',
      success: (res) => {
        if (!res.confirm || !id) {
          return
        }

        api.deleteProcess(id).then(() => {
          wx.showToast({ title: '已停用', icon: 'none' })
          this.loadProcesses()
        }).catch(() => {
          wx.showToast({ title: '停用失败', icon: 'none' })
        })
      }
    })
  }
})
