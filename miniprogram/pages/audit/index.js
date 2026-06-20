const api = require('../../utils/api')

Page({
  data: {
    tabs: [],
    activeStatus: 'pending',
    allAudits: [],
    audits: []
  },

  onLoad() {
    this.filterAudits('pending')
    this.loadAudits()
  },

  onShow() {
    this.loadAudits()
  },

  switchTab(event) {
    const { status } = event.currentTarget.dataset
    this.filterAudits(status)
  },

  buildTabs(activeStatus) {
    const pendingCount = this.data.allAudits.filter((item) => item.status === '待审核').length
    const reviewedCount = this.data.allAudits.length - pendingCount

    return [
      { label: '待审核', status: 'pending', count: pendingCount, active: activeStatus === 'pending' },
      { label: '已审核', status: 'reviewed', count: reviewedCount, active: activeStatus === 'reviewed' }
    ]
  },

  filterAudits(status) {
    const audits = status === 'pending'
      ? this.data.allAudits.filter((item) => item.status === '待审核')
      : this.data.allAudits.filter((item) => item.status !== '待审核')

    this.setData({
      activeStatus: status,
      tabs: this.buildTabs(status),
      audits
    })
  },

  openDetail(event) {
    const { id } = event.currentTarget.dataset

    wx.navigateTo({
      url: `/pages/audit-detail/index${id ? `?id=${id}` : ''}`
    })
  },

  approveAudit(event) {
    const { id } = event.currentTarget.dataset

    api.approveReport(id).then(() => {
      wx.showToast({ title: '已通过', icon: 'success' })
      this.loadAudits()
    }).catch(() => {
      wx.showToast({ title: '审核接口不可用', icon: 'none' })
    })
  },

  rejectAudit(event) {
    const { id } = event.currentTarget.dataset

    wx.showModal({
      title: '确认驳回？',
      content: '驳回后员工需要重新核对报工信息。',
      confirmText: '驳回',
      success: (res) => {
        if (!res.confirm) {
          return
        }

        api.rejectReport(id, '数量或工序信息需要核对').then(() => {
          wx.showToast({ title: '已驳回', icon: 'none' })
          this.loadAudits()
        }).catch(() => {
          wx.showToast({ title: '审核接口不可用', icon: 'none' })
        })
      }
    })
  },

  loadAudits() {
    api.getReports().then((reports) => {
      this.setData({
        allAudits: Array.isArray(reports) ? reports.map((report, index) => this.normalizeAudit(report, index)) : []
      })
      this.filterAudits(this.data.activeStatus)
    }).catch(() => {})
  },

  normalizeAudit(report, index) {
    const statusMap = {
      pending: { status: '待审核', tone: 'amber' },
      approved: { status: '已通过', tone: 'green' },
      rejected: { status: '已驳回', tone: 'red' },
      withdrawn: { status: '已撤回', tone: 'gray' }
    }
    const firstItem = report.items && report.items[0] ? report.items[0] : {}
    const status = statusMap[report.status] || statusMap.pending
    const name = report.workerName || report.userName || '未知员工'

    return {
      id: report.id,
      name,
      initial: name.slice(0, 1),
      color: ['#3B82F6', '#6366F1', '#60A5FA', '#0891B2'][index % 4],
      code: report.id,
      process: firstItem.processName || '报工记录',
      count: `${report.quantity || 0}件`,
      time: this.formatTime(report.createdAt),
      status: status.status,
      tone: status.tone
    }
  },

  formatTime(value) {
    if (!value) {
      return ''
    }

    return value.replace('T', ' ').slice(11, 16)
  }
})
