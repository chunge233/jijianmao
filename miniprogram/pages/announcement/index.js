const api = require('../../utils/api')

Page({
  data: {
    announcements: []
  },

  onLoad() {
    this.loadAnnouncements()
  },

  onShow() {
    this.loadAnnouncements()
  },

  createAnnouncement() {
    wx.navigateTo({
      url: '/pages/announcement-new/index'
    })
  },

  editAnnouncement(event) {
    const { id } = event.currentTarget.dataset

    wx.navigateTo({
      url: `/pages/announcement-new/index${id ? `?id=${id}` : ''}`
    })
  },

  openAnnouncementDetail(event) {
    const { id } = event.currentTarget.dataset

    wx.navigateTo({
      url: `/pages/announcement-detail/index${id ? `?id=${id}` : ''}`
    })
  },

  deleteAnnouncement(event) {
    const { id } = event.currentTarget.dataset

    api.deleteAnnouncement(id).then(() => {
      wx.showToast({ title: '已删除', icon: 'none' })
      this.loadAnnouncements()
    }).catch(() => {
      wx.showToast({ title: '删除失败', icon: 'none' })
    })
  },

  loadAnnouncements() {
    api.getAnnouncements().then((announcements) => {
      this.setData({
        announcements: (Array.isArray(announcements) ? announcements : []).map((item) => ({
          id: item.id,
          title: item.title,
          date: this.formatDate(item.createdAt)
        }))
      })
    }).catch(() => {
      this.setData({ announcements: [] })
    })
  },

  formatDate(value) {
    if (!value) {
      return ''
    }

    return value.slice(0, 10)
  }
})
