const { hideTabBar } = require('../../utils/tabbar')

Page({
  onShow() {
    hideTabBar()
  },

  goCreate() {
    wx.navigateTo({
      url: '/pages/factory-create/index'
    })
  }
})
