const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')

const basePage = createPenPage(screens.reportResubmit)

Page({
  ...basePage,

  data: {
    screen: screens.reportResubmit,
    draftId: '',
    reportId: ''
  },

  onLoad(options) {
    this.setData({
      draftId: (options && options.draftId) || '',
      reportId: (options && options.id) || ''
    })
  },

  handleAction(event) {
    const { action } = event.detail || {}

    if (action === 'save') {
      this.resubmit()
      return
    }

    basePage.handleAction.call(this, event)
  },

  resubmit() {
    const request = this.data.draftId
      ? api.submitReportDraft(this.data.draftId)
      : api.resubmitReport(this.data.reportId, '已补充信息后重新提交')

    request.then((res) => {
      const report = res && res.report
      wx.navigateTo({
        url: `/pages/submit-success/index?type=${encodeURIComponent('重新提交')}&processCount=${report && report.items ? report.items.length : 1}&quantity=${report ? report.quantity : 0}&amount=${report ? (Number(report.totalCents || 0) / 100).toFixed(2) : '0.00'}`
      })
    }).catch(() => {
      wx.showToast({ title: '重新提交失败', icon: 'none' })
    })
  }
})
