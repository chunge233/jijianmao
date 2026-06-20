const api = require('../../utils/api')

Page({
  data: {
    tabs: [
      { label: '全部', count: '76', active: true },
      { label: '待审核', count: '5' },
      { label: '已通过', count: '27' },
      { label: '未通过', count: '3' }
    ],
    chips: ['全部类型', '单工序', '工艺路线'],
    activeStatus: '全部',
    activeType: '全部类型',
    allRecords: [],
    records: []
  },

  onLoad() {
    this.applyFilters('全部', '全部类型')
    this.loadRecords()
  },

  onShow() {
    this.loadRecords()
  },

  switchTab(event) {
    const { label } = event.currentTarget.dataset
    this.applyFilters(label, this.data.activeType)
  },

  switchType(event) {
    const { type } = event.currentTarget.dataset
    this.applyFilters(this.data.activeStatus, type)
  },

  buildTabs(activeStatus) {
    const statuses = ['全部', '待审核', '已通过', '未通过']

    return statuses.map((status) => {
      const count = status === '全部'
        ? this.data.allRecords.length
        : this.data.allRecords.filter((item) => item.status === status).length

      return {
        label: status,
        count: String(count),
        active: status === activeStatus
      }
    })
  },

  applyFilters(status, type) {
    const records = this.data.allRecords.filter((item) => {
      const statusMatched = status === '全部' || item.status === status
      const typeMatched = type === '全部类型' || item.type === type

      return statusMatched && typeMatched
    })

    this.setData({
      activeStatus: status,
      activeType: type,
      tabs: this.buildTabs(status),
      records
    })
  },

  openRecord(event) {
    const { path } = event.currentTarget.dataset

    if (!path) {
      return
    }

    wx.navigateTo({
      url: path
    })
  },

  loadRecords() {
    api.getReports({ mine: true }).then((reports) => {
      this.setData({
        allRecords: Array.isArray(reports) ? reports.map((report) => this.normalizeRecord(report)) : []
      })
      this.applyFilters(this.data.activeStatus, this.data.activeType)
    }).catch(() => {})
  },

  normalizeRecord(report) {
    const statusMap = {
      pending: { status: '待审核', tone: 'amber' },
      approved: { status: '已通过', tone: 'green' },
      rejected: { status: '未通过', tone: 'red' },
      withdrawn: { status: '已撤回', tone: 'gray' }
    }
    const firstItem = report.items && report.items[0] ? report.items[0] : {}
    const type = report.type === 'route' ? '工艺路线' : '单工序'
    const status = statusMap[report.status] || statusMap.pending

    return {
      id: report.id,
      title: report.type === 'route' ? '工艺路线报工' : (firstItem.processName || '报工记录'),
      status: status.status,
      tone: status.tone,
      type,
      count: `${report.quantity || 0} 件`,
      amount: `+¥${((report.totalCents || 0) / 100).toFixed(2)}`,
      note: report.auditReason || report.remark || '',
      worker: '我',
      reviewer: report.status === 'pending' ? '审核 —' : '审核 管理员',
      time: this.formatTime(report.createdAt),
      path: report.type === 'route'
        ? `/pages/report-detail-route/index?id=${report.id}`
        : `/pages/report-detail-single/index?id=${report.id}`
    }
  },

  formatTime(value) {
    if (!value) {
      return ''
    }

    return value.replace('T', ' ').slice(5, 16)
  }
})
