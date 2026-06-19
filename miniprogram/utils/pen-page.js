function createPenPage(screen) {
  return {
    data: {
      screen
    },

    handleAction(event) {
      const { action, path, title } = event.detail || {}

      if (path) {
        wx.navigateTo({
          url: path
        })
        return
      }

      if (action === 'back') {
        wx.navigateBack()
        return
      }

      if (action === 'switchTabHome') {
        wx.switchTab({
          url: '/pages/home/index'
        })
        return
      }

      wx.showToast({
        title: title || '已点击',
        icon: 'none'
      })
    }
  }
}

module.exports = {
  createPenPage
}
