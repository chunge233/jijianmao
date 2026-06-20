const api = require('../../utils/api')
const { hideTabBar } = require('../../utils/tabbar')

Page({
  data: {
    inviteCode: '',
    avatars: ['计', '件', '猫', '+']
  },

  onShow() {
    hideTabBar()
  },

  onLoad(options) {
    const inviteCode = (options && options.inviteCode) || ''
    if (inviteCode) {
      this.setData({ inviteCode })
    }
  },

  onInviteInput(event) {
    this.setData({
      inviteCode: String(event.detail.value || '').toUpperCase()
    })
  },

  joinFactory() {
    const inviteCode = this.data.inviteCode.trim()

    if (!inviteCode) {
      wx.showToast({ title: '请输入邀请码', icon: 'none' })
      return
    }

    wx.showLoading({ title: '加入中' })

    api.joinFactory(inviteCode).then((res) => {
      wx.hideLoading()

      if (res && res.ok === false) {
        wx.showToast({ title: res.message || '邀请码不存在', icon: 'none' })
        return
      }

      if (res && res.token) {
        wx.setStorageSync('auth_token', res.token)
      }

      if (res && res.factory) {
        wx.setStorageSync('current_factory', res.factory)
      }

      wx.showToast({
        title: '已加入工厂',
        icon: 'none'
      })
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/home/index'
        })
      }, 450)
    }).catch((error) => {
      wx.hideLoading()
      wx.showToast({
        title: error.message || '加入失败',
        icon: 'none'
      })
    })
  }
})
