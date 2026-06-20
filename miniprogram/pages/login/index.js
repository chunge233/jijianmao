const api = require('../../utils/api')
const { hideTabBar } = require('../../utils/tabbar')

Page({
  data: {
    agreed: true,
    phone: '',
    code: '',
    codeButtonText: '获取验证码',
    canSendCode: true,
    countdown: 0,
    loggingIn: false
  },

  countdownTimer: null,

  onLoad() {
    const phone = wx.getStorageSync('login_phone') || ''
    this.setData({ phone })

    if (this.isValidPhone(phone)) {
      this.restoreCountdown(phone)
    }
  },

  onShow() {
    hideTabBar()
  },

  onUnload() {
    this.clearCountdown()
  },

  toggleAgree() {
    this.setData({
      agreed: !this.data.agreed
    })
  },

  onPhoneInput(event) {
    const phone = event.detail.value || ''
    this.setData({ phone })
    wx.setStorageSync('login_phone', phone)

    if (this.isValidPhone(phone)) {
      this.restoreCountdown(phone)
    }
  },

  onCodeInput(event) {
    this.setData({
      code: event.detail.value || ''
    })
  },

  sendCode() {
    if (!this.data.canSendCode) {
      return
    }

    const phone = this.data.phone.trim()
    if (!this.isValidPhone(phone)) {
      wx.showToast({ title: '请输入正确手机号', icon: 'none' })
      return
    }

    wx.showLoading({ title: '发送中' })
    api.sendSmsCode(phone).then((res) => {
      wx.hideLoading()
      const data = res.data || {}
      const waitSeconds = data.waitSeconds || 60

      this.startCountdown(waitSeconds)

      if (data.devCode) {
        this.setData({ code: data.devCode })
        wx.showToast({ title: `开发验证码 ${data.devCode}`, icon: 'none' })
        return
      }

      wx.showToast({ title: '验证码已发送', icon: 'success' })
    }).catch((error) => {
      wx.hideLoading()
      wx.showToast({
        title: error.message || '验证码发送失败',
        icon: 'none'
      })
    })
  },

  goFactorySelect() {
    if (!this.data.agreed) {
      wx.showToast({
        title: '请先同意协议',
        icon: 'none'
      })
      return
    }

    const phone = this.data.phone.trim()
    const code = this.data.code.trim()

    if (!this.isValidPhone(phone)) {
      wx.showToast({ title: '请输入正确手机号', icon: 'none' })
      return
    }

    if (!/^\d{4,6}$/.test(code)) {
      wx.showToast({ title: '请输入正确验证码', icon: 'none' })
      return
    }

    this.setData({ loggingIn: true })
    wx.showLoading({ title: '登录中' })

    api.loginBySms({
      phone,
      code,
      nickname: `用户${phone.slice(-4)}`
    }).then((res) => {
      const data = res.data || res
      wx.hideLoading()
      this.setData({ loggingIn: false })
      wx.setStorageSync('auth_token', data.token || data.accessToken)
      wx.setStorageSync('current_user', data.user)

      if (data.factory && !data.needsFactory) {
        wx.setStorageSync('current_factory', data.factory)
        wx.switchTab({
          url: '/pages/home/index'
        })
        return
      }

      wx.removeStorageSync('current_factory')
      wx.redirectTo({
        url: '/pages/factory-select/index'
      })
    }).catch((error) => {
      wx.hideLoading()
      this.setData({ loggingIn: false })
      wx.showToast({
        title: error.message || '登录失败，请稍后重试',
        icon: 'none'
      })
    })
  },

  restoreCountdown(phone) {
    api.getSmsCountdown(phone).then((res) => {
      const waitSeconds = res.data && res.data.waitSeconds
      if (waitSeconds > 0) {
        this.startCountdown(waitSeconds)
      }
    }).catch(() => {})
  },

  startCountdown(seconds) {
    this.clearCountdown()
    this.setData({
      canSendCode: false,
      countdown: seconds,
      codeButtonText: `${seconds}秒`
    })

    this.countdownTimer = setInterval(() => {
      const countdown = this.data.countdown - 1
      if (countdown <= 0) {
        this.clearCountdown()
        this.setData({
          canSendCode: true,
          countdown: 0,
          codeButtonText: '获取验证码'
        })
        return
      }

      this.setData({
        countdown,
        codeButtonText: `${countdown}秒`
      })
    }, 1000)
  },

  clearCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer)
      this.countdownTimer = null
    }
  },

  isValidPhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone)
  }
})
