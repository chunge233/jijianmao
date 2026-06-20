const api = require('../../../utils/api')

Page({
  data: {
    records: []
  },

  onLoad() {
    this.loadExports()
  },

  onShow() {
    this.loadExports()
  },

  download(event) {
    const { name } = event.currentTarget.dataset
    api.createExport(name || '导出记录').then(() => {
      wx.showToast({ title: `已生成${name}`, icon: 'none' })
      this.loadExports()
    }).catch(() => {
      wx.showToast({ title: '导出失败', icon: 'none' })
    })
  },

  loadExports() {
    api.getExports().then((records) => {
      this.setData({
        records: (Array.isArray(records) ? records : []).map((item) => ({
          id: item.id,
          name: item.name,
          scope: item.scope || item.status || '导出任务',
          time: this.formatTime(item.createdAt)
        }))
      })
    }).catch(() => {
      this.setData({ records: [] })
    })
  },

  formatTime(value) {
    if (!value) {
      return ''
    }

    return value.replace('T', ' ').slice(5, 16)
  }
})
