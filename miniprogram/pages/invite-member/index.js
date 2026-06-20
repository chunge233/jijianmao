const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')

const basePage = createPenPage(screens.inviteMember)

Page({
  ...basePage,

  handleAction(event) {
    const { action } = event.detail || {}

    if (action === 'copyInvite') {
      api.createInvitation({
        name: '新成员',
        phone: '',
        role: 'employee'
      }).then((res) => {
        if (res && res.inviteCode) {
          this.copyText(res.inviteCode, '邀请码已复制')
          return
        }

        wx.showToast({ title: '邀请码获取失败', icon: 'none' })
      }).catch(() => {
        wx.showToast({ title: '邀请码获取失败', icon: 'none' })
      })
      return
    }

    basePage.handleAction.call(this, event)
  }
})
