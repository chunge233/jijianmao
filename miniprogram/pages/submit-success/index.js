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
