const api = require('../../../utils/api')

Page({
  data: {
    applies: []
  },

  onLoad() {
    this.loadApplications()
  },

  onShow() {
    this.loadApplications()
  },

  approve(event) {
    const { id } = event.currentTarget.dataset

    api.approveJoinApplication(id).then(() => {
      wx.showToast({ title: '已通过', icon: 'success' })
      this.loadApplications()
    }).catch(() => {
      wx.showToast({ title: '操作失败', icon: 'none' })
    })
  },

  reject(event) {
    const { id } = event.currentTarget.dataset

    api.rejectJoinApplication(id).then(() => {
      wx.showToast({ title: '已拒绝', icon: 'none' })
      this.loadApplications()
    }).catch(() => {
      wx.showToast({ title: '操作失败', icon: 'none' })
    })
  },

  loadApplications() {
    api.getJoinApplications().then((applications) => {
      this.setData({
        applies: (Array.isArray(applications) ? applications : []).map((item) => this.normalizeApplication(item))
      })
    }).catch(() => {
      this.setData({ applies: [] })
    })
  },

  normalizeApplication(item) {
    const name = item.name || item.nickname || item.phone || '待加入成员'
    const statusMap = {
      pending: '待处理',
      approved: '已通过',
      rejected: '已拒绝'
    }

    return {
      id: item.id,
      initial: name.slice(0, 1),
      name,
      role: this.getRoleText(item.role),
      team: item.phone || '未填写手机号',
      time: this.formatTime(item.createdAt),
      status: statusMap[item.status] || '待处理'
    }
  },

  getRoleText(role) {
    const map = {
      boss: '老板',
      manager: '管理员',
      finance: '财务',
      employee: '工人'
    }

    return map[role] || '工人'
  },

  formatTime(value) {
    if (!value) {
      return ''
    }

    return value.replace('T', ' ').slice(0, 16)
  }
})
