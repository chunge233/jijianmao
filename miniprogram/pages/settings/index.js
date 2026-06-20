Page({
  data: {
    isLoggedIn: false,
    firstRows: [
      { icon: '/assets/icons/shield-check-gray.svg', title: '账号安全', desc: '修改密码、绑定手机', path: '/pages/account-security/index' }
    ],
    secondRows: []
  },

  onShow() {
    this.setData({
      isLoggedIn: !!wx.getStorageSync('auth_token')
    })
  },

  openRow(event) {
    const { path } = event.currentTarget.dataset

    if (!path) {
      return
    }

    wx.navigateTo({
      url: path
    })
  },

  logout() {
    wx.showModal({
      title: '退出登录？',
      content: '退出后将返回登录页。',
      confirmText: '退出',
      success: (res) => {
        if (!res.confirm) {
          return
        }

        wx.redirectTo({
          url: '/pages/login/index'
        })
        wx.removeStorageSync('auth_token')
        wx.removeStorageSync('current_user')
        wx.removeStorageSync('current_factory')
      }
    })
  }
})
