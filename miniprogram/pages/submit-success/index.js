Page({
  data: {
    summary: [
      { label: '报工类型', value: '单工序' },
      { label: '工序数量', value: '3 道工序' },
      { label: '报工件数', value: '100 件' },
      { label: '报工日期', value: '2026年6月17日' },
      { label: '合计金额', value: '¥35.50', tone: 'amount' }
    ]
  },

  onLoad(options) {
    if (!options || !options.type) {
      return
    }

    const type = decodeURIComponent(options.type)
    const processCount = options.processCount || '1'
    const quantity = options.quantity || '0'
    const amount = options.amount ? `¥${Number(options.amount).toFixed(2)}` : '¥0.00'

    this.setData({
      summary: [
        { label: '报工类型', value: type },
        { label: '工序数量', value: `${processCount} 道工序` },
        { label: '报工件数', value: `${quantity} 件` },
        { label: '报工日期', value: this.formatToday() },
        { label: '合计金额', value: amount, tone: 'amount' }
      ]
    })
  },

  formatToday() {
    const date = new Date()
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  },

  goRecords() {
    wx.navigateTo({
      url: '/pages/report-records/index'
    })
  },

  goReport() {
    const pages = getCurrentPages()

    if (pages.length > 1) {
      wx.navigateBack()
      return
    }

    wx.navigateTo({
      url: '/pages/report/index'
    })
  }
})
