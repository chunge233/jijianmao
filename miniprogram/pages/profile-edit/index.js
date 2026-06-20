const api = require('../../utils/api')

Page({
  data: {
    isLoggedIn: false,
    defaultAvatarIcon: '/assets/tabbar/profile.svg',
    nickname: '',
    phone: '',
    maskedPhone: '未绑定',
    factoryName: '未加入工厂',
    avatarText: '我',
    saving: false
  },

  onLoad() {
    this.loadProfile()
  },

  loadProfile() {
    api.getMe().then((res) => {
      const user = (res && res.user) || {}
      const factory = (res && res.factory) || {}
      const nickname = user.nickname || ''

      this.setData({
        isLoggedIn: !!user.id,
        nickname,
        phone: user.phone || '',
        maskedPhone: this.maskPhone(user.phone),
        factoryName: factory.name || '未加入工厂',
        avatarText: (nickname || user.phone || '我').slice(0, 1)
      })
    }).catch(() => {
      const user = wx.getStorageSync('current_user') || {}
      const factory = wx.getStorageSync('current_factory') || {}
      const nickname = user.nickname || ''

      this.setData({
        isLoggedIn: !!user.id,
        nickname,
        phone: user.phone || '',
        maskedPhone: this.maskPhone(user.phone),
        factoryName: factory.name || '未加入工厂',
        avatarText: (nickname || user.phone || '我').slice(0, 1)
      })
    })
  },

  onNicknameInput(event) {
    const nickname = event.detail.value
    this.setData({
      nickname,
      avatarText: (nickname || this.data.phone || '我').slice(0, 1)
    })
  },

  saveProfile() {
    const nickname = this.data.nickname.trim()

    if (!nickname) {
      wx.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }

    this.setData({ saving: true })

    api.updateMe({ nickname }).then((res) => {
      const user = (res && res.user) || {}
      wx.setStorageSync('current_user', user)
      wx.showToast({ title: '已保存', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 500)
    }).catch((error) => {
      wx.showToast({ title: error.message || '保存失败', icon: 'none' })
    }).finally(() => {
      this.setData({ saving: false })
    })
  },

  maskPhone(phone) {
    if (!phone || phone.length < 7) {
      return phone || '未绑定'
    }

    return `${phone.slice(0, 3)}****${phone.slice(-4)}`
  }
})
