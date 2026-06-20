const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')

const basePage = createPenPage(screens.feedback)

Page({
  ...basePage,

  handleAction(event) {
    const { action } = event.detail || {}

    if (action === 'submitFeedback') {
      api.submitFeedback('功能建议：希望优化报工和工资核对流程。').then(() => {
        this.toastAndBack('反馈已提交')
      }).catch(() => {
        wx.showToast({ title: '反馈提交失败', icon: 'none' })
      })
      return
    }

    basePage.handleAction.call(this, event)
  }
})
