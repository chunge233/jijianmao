const api = require('../../../utils/api')

Page({
  data: {
    month: '2026-06',
    monthText: '2026年6月',
    progress: 0,
    progressText: '暂无工资确认数据',
    tabs: [
      { label: '待确认', active: true },
      { label: '已确认' },
      { label: '异议中' }
    ],
    allEmployees: [],
    employees: [],
    activeStatus: '待确认',
    canRemind: false
  },

  onLoad() {
    this.setMonthText()
    this.filterEmployees('待确认')
    this.loadConfirmations()
  },

  onShow() {
    this.loadConfirmations()
  },

  switchTab(event) {
    const { status } = event.currentTarget.dataset
    this.filterEmployees(status)
  },

  filterEmployees(status) {
    const employees = this.data.allEmployees.filter((item) => item.status === status)
    this.setData({
      tabs: this.data.tabs.map((tab) => ({
        ...tab,
        active: tab.label === status
      })),
      activeStatus: status,
      employees,
      canRemind: status === '待确认' && employees.length > 0
    })
  },

  remind() {
    if (!this.data.canRemind) {
      wx.showToast({ title: '暂无可提醒员工', icon: 'none' })
      return
    }
    wx.showToast({ title: '已发送催确认提醒', icon: 'none' })
  },

  setMonthText() {
    const [year, month] = this.data.month.split('-')
    this.setData({
      monthText: `${year}年${Number(month)}月`
    })
  },

  loadConfirmations() {
    api.getSalaryConfirmations(this.data.month).then((res) => {
      if (!res || !Array.isArray(res.employees)) {
        this.setData({
          progress: 0,
          progressText: '暂无工资确认数据',
          allEmployees: []
        })
        this.filterEmployees(this.data.tabs.find((item) => item.active)?.label || '待确认')
        return
      }

      this.setData({
        progress: res.progress,
        progressText: `${res.total}人中 ${res.confirmed} 人已确认，${res.disputed} 人异议中`,
        allEmployees: res.employees.map((employee) => ({
          name: employee.name,
          team: employee.team,
          amount: `¥${(Number(employee.amountCents || 0) / 100).toFixed(2)}`,
          status: employee.status,
          tone: employee.status === '已确认' ? 'green' : (employee.status === '异议中' ? 'red' : 'amber')
        }))
      })
      const active = this.data.tabs.find((item) => item.active)
      this.filterEmployees(active ? active.label : '待确认')
    }).catch(() => {
      this.setData({
        progress: 0,
        progressText: '暂无工资确认数据',
        allEmployees: []
      })
      this.filterEmployees(this.data.tabs.find((item) => item.active)?.label || '待确认')
    })
  }
})
