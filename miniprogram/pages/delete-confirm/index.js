const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')

const basePage = createPenPage(screens.deleteConfirm)

const deleteRequests = {
  process: api.deleteProcess,
  product: api.deleteProduct,
  route: api.deleteRoute,
  announcement: api.deleteAnnouncement
}

Page({
  ...basePage,

  data: {
    ...basePage.data,
    targetId: '',
    targetType: ''
  },

  onLoad(options) {
    this.setData({
      targetId: (options && options.id) || '',
      targetType: (options && options.type) || ''
    })
  },

  handleAction(event) {
    const { action } = event.detail || {}

    if (action === 'delete') {
      this.deleteTarget()
      return
    }

    basePage.handleAction.call(this, event)
  },

  deleteTarget() {
    const request = deleteRequests[this.data.targetType]

    if (!this.data.targetId || !request) {
      wx.showToast({ title: '缺少删除对象', icon: 'none' })
      return
    }

    request(this.data.targetId).then(() => {
      this.toastAndBack('已删除')
    }).catch(() => {
      wx.showToast({ title: '删除失败', icon: 'none' })
    })
  }
})
