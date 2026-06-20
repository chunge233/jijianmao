const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')

const basePage = createPenPage(screens.announcementNew)

Page({
  ...basePage,

  data: {
    screen: screens.announcementNew,
    announcementId: ''
  },

  onLoad(options) {
    this.setData({
      announcementId: (options && options.id) || ''
    })
  },

  handleAction(event) {
    const { action, title } = event.detail || {}

    if (action === 'save' || action === 'publish') {
      const payload = {
        title: '生产通知',
        content: '请各班组及时查看生产安排，按工艺路线完成扫码报工。',
        status: 'published'
      }
      const saveRequest = this.data.announcementId
        ? api.updateAnnouncement(this.data.announcementId, payload)
        : api.createAnnouncement(payload)

      saveRequest.then(() => {
        this.toastAndBack('公告已发布')
      }).catch(() => {
        basePage.handleAction.call(this, event)
      })
      return
    }

    basePage.handleAction.call(this, event)
  }
})
