const { hideTabBar } = require('../../utils/tabbar')

Page({
  onShow() {
    hideTabBar()
  },

  goJoin() {
    wx.navigateTo({
      url: '/pages/factory-join/index'
    })
  },

  goCreate() {
    wx.navigateTo({
      url: '/pages/factory-create/index'
    })
  }
})
