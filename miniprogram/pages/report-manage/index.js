const api = require('../../utils/api')

Page({
  data: {
    tabs: [
      { label: '全部', active: true },
      { label: '待审核' },
      { label: '已通过' },
      { label: '未通过' }
    ],
    chips: ['全部类型', '单工序', '工艺路线'],
    activeTab: '全部',
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
    this.applyFilters(this.data.activeTab, type)
  },

  applyFilters(label, type) {
    const tabs = this.data.tabs.map((tab) => ({
      ...tab,
      active: tab.label === label
    }))
    const records = this.data.allRecords.filter((item) => {
      const statusMatched = label === '全部' || item.status === label
      const typeMatched = type === '全部类型' || item.type === type

      return statusMatched && typeMatched
    })

    this.setData({
      activeTab: label,
      activeType: type,
      tabs,
      records
    })
  },

  openRecord(event) {
    const { id } = event.currentTarget.dataset
    const record = this.data.records.find((item) => item.id === id) || {}
    const isRoute = record.type === '工艺路线'

    wx.navigateTo({
      url: `${isRoute ? '/pages/report-detail-route/index' : '/pages/report-detail-single/index'}${id ? `?id=${id}` : ''}`
    })
  },

  openFilter() {
    wx.navigateTo({
      url: '/pages/report-filter/index'
    })
  },

  loadRecords() {
    api.getReports().then((reports) => {
      this.setData({
        allRecords: Array.isArray(reports) ? reports.map((report) => this.normalizeRecord(report)) : []
      })
      this.applyFilters(this.data.activeTab, this.data.activeType)
    }).catch(() => {})
  },

  normalizeRecord(report) {
    const statusMap = {
      pending: { status: '待审核', tone: 'amber' },
      approved: { status: '已通过', tone: 'green' },
      rejected: { status: '未通过', tone: 'red' },
      withdrawn: { status: '已撤回', tone: 'gray' }
    }
    const type = report.type === 'route' ? '工艺路线' : '单工序'
    const firstItem = report.items && report.items[0] ? report.items[0] : {}
    const status = statusMap[report.status] || statusMap.pending

    return {
      id: report.id,
      title: report.type === 'route' ? '工艺路线报工' : (firstItem.processName || '单工序报工'),
      status: status.status,
      tone: status.tone,
      type,
      typeTone: report.type === 'route' ? 'amber' : 'blue',
      count: `${report.quantity || 0} 件`,
      amount: `+¥${((report.totalCents || 0) / 100).toFixed(2)}`,
      note: report.auditReason || report.remark || '',
      worker: report.workerName || '员工',
      reviewer: report.status === 'pending' ? '审核 —' : '审核 管理员',
      time: this.formatTime(report.createdAt),
      photo: false
    }
  },

  formatTime(value) {
    if (!value) {
      return ''
    }

    return value.replace('T', ' ').slice(5, 16)
  }
})
