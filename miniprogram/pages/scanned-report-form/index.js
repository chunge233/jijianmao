Page({
  onLoad(options) {
    this.redirectToReport(options || {})
  },

  redirectToReport(options) {
    const query = Object.keys(options).filter((key) => options[key]).map((key) => {
      return `${key}=${encodeURIComponent(options[key])}`
    }).join('&')

    wx.redirectTo({
      url: `/pages/report/index${query ? `?${query}` : ''}`
    })
  }
})
