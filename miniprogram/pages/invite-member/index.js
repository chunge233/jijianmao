const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')

const basePage = createPenPage(screens.inviteMember)

Page({
  ...basePage,

  data: {
    ...basePage.data,
    inviteCode: '',
    inviteFactoryName: ''
  },

  onLoad() {
    this.prepareInviteShare()
  },

  onShow() {
    this.prepareInviteShare()
  },

  handleAction(event) {
    const { action } = event.detail || {}

    if (action === 'shareInvite') {
      if (!this.data.inviteCode) {
        this.prepareInviteShare()
      }
      return
    }

    basePage.handleAction.call(this, event)
  },

  prepareInviteShare() {
    const factory = wx.getStorageSync('current_factory') || {}

    if (factory.inviteCode) {
      this.setData({
        inviteCode: factory.inviteCode,
        inviteFactoryName: factory.name || '工厂'
      })
      wx.showShareMenu({ withShareTicket: true })
      return
    }

    api.createInvitation({
      name: '新成员',
      phone: '',
      role: 'employee'
    }).then((res) => {
      if (res && res.inviteCode) {
        this.setData({
          inviteCode: res.inviteCode,
          inviteFactoryName: (res.factory && res.factory.name) || factory.name || '工厂'
        })
        wx.showShareMenu({ withShareTicket: true })
      }
    }).catch(() => {})
  },

  onShareAppMessage() {
    const inviteCode = this.data.inviteCode
    const factoryName = this.data.inviteFactoryName || '工厂'

    return {
      title: `邀请你加入${factoryName}`,
      path: inviteCode
        ? `/pages/factory-join/index?inviteCode=${encodeURIComponent(inviteCode)}`
        : '/pages/factory-select/index'
    }
  }
})
