Page({
  data: {
    announcements: [
      { id: 'A001', title: '关于端午节放假安排的通知', date: '2026-06-15' },
      { id: 'A002', title: '6月工价调整公告', date: '2026-06-10' },
      { id: 'A003', title: '新员工入职培训通知', date: '2026-06-05' },
      { id: 'A004', title: '工厂安全生产规范更新', date: '2026-06-01' }
    ]
  },

  createAnnouncement() {
    wx.showToast({
      title: '新增公告',
      icon: 'none'
    })
  },

  editAnnouncement(event) {
    const { title } = event.currentTarget.dataset

    wx.showToast({
      title: `编辑 ${title}`,
      icon: 'none'
    })
  },

  deleteAnnouncement(event) {
    const { id } = event.currentTarget.dataset
    const announcements = this.data.announcements.filter((item) => item.id !== id)

    this.setData({ announcements })
  }
})
