App({
  globalData: {
    systemInfo: null,
    safeBottom: 0
  },

  onLaunch() {
    this.updateDeviceMetrics()
  },

  updateDeviceMetrics() {
    try {
      const info = typeof wx.getWindowInfo === 'function'
        ? wx.getWindowInfo()
        : wx.getSystemInfoSync()
      const safeArea = info.safeArea || {}
      const screenHeight = info.screenHeight || info.windowHeight || 0
      const safeBottom = safeArea.bottom
        ? Math.max(screenHeight - safeArea.bottom, 0)
        : 0

      this.globalData.systemInfo = info
      this.globalData.safeBottom = safeBottom
    } catch (error) {
      this.globalData.safeBottom = 0
    }
  }
})
