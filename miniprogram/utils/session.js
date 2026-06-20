const api = require('./api')
const { hideTabBar } = require('./tabbar')

function getCachedFactory() {
  const factory = wx.getStorageSync('current_factory')
  return factory && factory.id ? factory : null
}

function ensureFactorySelected() {
  if (!wx.getStorageSync('auth_token')) {
    hideTabBar()
    wx.navigateTo({
      url: '/pages/login/index'
    })
    return Promise.resolve(false)
  }

  if (getCachedFactory()) {
    return Promise.resolve(true)
  }

  return api.getMe().then((me) => {
    const factory = me && me.factory

    if (factory && factory.id) {
      wx.setStorageSync('current_factory', factory)
      return true
    }

    hideTabBar()
    wx.navigateTo({
      url: '/pages/factory-select/index'
    })
    return false
  }).catch(() => {
    wx.removeStorageSync('auth_token')
    wx.removeStorageSync('current_user')
    wx.removeStorageSync('current_factory')
    hideTabBar()
    wx.navigateTo({
      url: '/pages/login/index'
    })
    return false
  })
}

module.exports = {
  ensureFactorySelected,
  getCachedFactory
}
