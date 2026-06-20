const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')

const basePage = createPenPage(screens.reportWithdraw)

Page({
  ...basePage,

  data: {
    screen: screens.reportWithdraw,
    reportId: ''
  },

  onLoad(options) {
    this.setData({
      reportId: (options && options.id) || ''
    })
  },

  handleAction(event) {
    const { action } = event.detail || {}

    if (action === 'withdraw' && this.data.reportId) {
      api.withdrawReport(this.data.reportId).then(() => {
        wx.showToast({ title: '已撤回', icon: 'none' })
        setTimeout(() => wx.navigateBack(), 450)
      }).catch(() => {
        wx.showToast({ title: '撤回失败', icon: 'none' })
      })
      return
    }

    basePage.handleAction.call(this, event)
  }
})
