const api = require('../../utils/api')

Page({
  data: {
    tabs: [
      { label: '待处理', count: 0, active: true },
      { label: '已处理', count: 0 }
    ],
    month: '2026-06',
    currentTab: 0,
    allDisputes: [],
    disputes: []
  },

  onLoad() {
    this.filterDisputes(0)
    this.loadDisputes()
  },

  onShow() {
    this.loadDisputes()
  },

  switchTab(event) {
    const { index } = event.currentTarget.dataset
    this.filterDisputes(index)
  },

  filterDisputes(index) {
    const status = index === 0 ? '待处理' : '已处理'
    const tabs = this.data.tabs.map((tab, tabIndex) => ({
      ...tab,
      count: this.data.allDisputes.filter((item) => item.status === tab.label).length,
      active: tabIndex === index
    }))
    const disputes = this.data.allDisputes.filter((item) => item.status === status)

    this.setData({
      currentTab: index,
      tabs,
      disputes
    })
  },

  openDispute(event) {
    const { id } = event.currentTarget.dataset

    wx.navigateTo({
      url: `/pages/dispute-detail/index?month=${encodeURIComponent(this.data.month)}${id ? `&id=${encodeURIComponent(id)}` : ''}`
    })
  },

  loadDisputes() {
    api.getSalaryConfirmations(this.data.month).then((res) => {
      const employees = res && Array.isArray(res.employees) ? res.employees : []
      const disputes = employees
        .filter((item) => item.status === '异议中')
        .map((item, index) => {
          const name = item.name || '未命名员工'
          return {
            id: item.id || `dispute_${index}`,
            initial: name.slice(0, 1),
            name,
            reason: '工资确认异议',
            status: '待处理',
            tone: 'amber',
            time: this.data.month
          }
        })

      this.setData({
        allDisputes: disputes
      })
      this.filterDisputes(this.data.currentTab)
    }).catch(() => {
      this.setData({
        allDisputes: []
      })
      this.filterDisputes(this.data.currentTab)
    })
  }
})
