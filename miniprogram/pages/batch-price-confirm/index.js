const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')

const basePage = createPenPage(screens.batchPriceConfirm)

Page({
  ...basePage,

  data: {
    screen: screens.batchPriceConfirm,
    adjustmentId: ''
  },

  onLoad(options) {
    this.setData({
      adjustmentId: (options && options.id) || ''
    })
  },

  handleAction(event) {
    const { action, title } = event.detail || {}

    if (action === 'confirmPrice') {
      if (!this.data.adjustmentId) {
        wx.showToast({ title: '缺少调价单', icon: 'none' })
        return
      }

      api.confirmPriceAdjustment(this.data.adjustmentId).then(() => {
        this.toastAndBack('调价已确认')
      }).catch(() => {
        wx.showToast({ title: '调价确认失败', icon: 'none' })
      })
      return
    }

    basePage.handleAction.call(this, event)
  }
})
