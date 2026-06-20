const { syncTabBar } = require('../../utils/tabbar')
const api = require('../../utils/api')
const { ensureFactorySelected } = require('../../utils/session')

Page({
  data: {
    messages: []
  },

  onShow() {
    ensureFactorySelected().then((ready) => {
      if (!ready) {
        return
      }

      syncTabBar(1)
      this.loadMessages()
    })
  },

  openDetail(event) {
    const { path } = event.currentTarget.dataset

    wx.navigateTo({
      url: path || '/pages/message-detail/index'
    })
  },

  readAll() {
    if (!this.data.messages.length) {
      wx.showToast({
        title: '暂无消息',
        icon: 'none'
      })
      return
    }

    api.readAllMessages().then(() => {
      this.markLocalReadAll()
    }).catch(() => {
      this.markLocalReadAll()
    })
  },

  loadMessages() {
    api.getMessages().then((messages) => {
      this.setData({
        messages: (Array.isArray(messages) ? messages : []).map((message) => this.normalizeMessage(message))
      })
    }).catch(() => {
      this.setData({ messages: [] })
    })
  },

  normalizeMessage(message) {
    const config = {
      system: { title: '系统推送', icon: '/assets/icons/bell-ringing-gray.svg', tone: 'gray', path: '/pages/message-detail/index' },
      audit: { title: '审核消息', icon: '/assets/icons/clipboard-amber.svg', tone: 'amber', path: '/pages/message-detail/index' },
      salary: { title: '工资消息', icon: '/assets/icons/currency-cny-green.svg', tone: 'green', path: '/pages/message-detail/index' },
      subscription: { title: '套餐消息', icon: '/assets/icons/package-green.svg', tone: 'blue', path: '/pages/message-detail/index' }
    }[message.type] || { title: '系统推送', icon: '/assets/icons/bell-ringing-gray.svg', tone: 'gray', path: '/pages/message-detail/index' }

    return {
      id: message.id,
      title: config.title,
      preview: message.content || message.title,
      icon: config.icon,
      tone: config.tone,
      unread: !message.read,
      path: `${config.path}${message.id ? `?id=${message.id}` : ''}`
    }
  },

  markLocalReadAll() {
    this.setData({
      messages: this.data.messages.map((item) => ({
        ...item,
        unread: false
      }))
    })

    wx.showToast({
      title: '已全部标记为已读',
      icon: 'none'
    })
  }
})
