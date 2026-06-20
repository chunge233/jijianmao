const api = require('../../utils/api')

Page({
  data: {
    currentMonth: '2026年6月 · 全厂',
    currentMonthValue: '2026-06',
    hasSalary: false,
    totalSalary: '¥0.00',
    confirmStatus: '暂无工资 · 等待报工通过后生成',
    confirmTone: 'gray',
    stats: [
      { label: '报工次数', value: '0', unit: '次', tone: 'blue' },
      { label: '总件数', value: '0', unit: '件', tone: 'green' },
      { label: '平均单价', value: '¥0.00', unit: '', tone: 'amber' }
    ],
    history: []
  },

  onLoad() {
    this.loadSalary()
  },

  onShow() {
    this.loadSalary()
  },

  loadSalary() {
    api.getSalaryMonths({ scope: 'factory' }).then((months) => {
      const current = Array.isArray(months) && months.length ? months[0] : null

      if (!current) {
        this.showEmptySalary()
        return
      }

      const reportCount = Number(current.reportCount || 0)
      const quantity = Number(current.quantity || 0)
      const totalCents = Number(current.totalCents || 0)
      const hasSalary = reportCount > 0 || quantity > 0 || totalCents > 0

      this.setData({
        currentMonth: `${this.formatMonth(current.month)} · 全厂`,
        currentMonthValue: current.month || '2026-06',
        hasSalary,
        totalSalary: this.formatAmount(totalCents),
        confirmStatus: hasSalary
          ? (current.status === 'confirmed' ? '已确认' : (current.status === 'disputed' ? '有异议 · 待处理' : '待确认 · 请核对工资后确认'))
          : '暂无工资 · 等待报工通过后生成',
        confirmTone: hasSalary
          ? (current.status === 'confirmed' ? 'green' : (current.status === 'disputed' ? 'red' : 'amber'))
          : 'gray',
        stats: [
          { label: '报工次数', value: `${reportCount}`, unit: '次', tone: 'blue' },
          { label: '总件数', value: `${quantity}`, unit: '件', tone: 'green' },
          { label: '平均单价', value: quantity ? this.formatAmount(totalCents / quantity) : '¥0.00', unit: '', tone: 'amber' }
        ],
        history: months.slice(1).map((item) => ({
          month: this.formatMonth(item.month),
          amount: this.formatAmount(item.totalCents),
          status: item.status === 'confirmed' ? '已确认' : (item.status === 'disputed' ? '有异议' : '待确认'),
          tone: item.status === 'confirmed' ? 'green' : (item.status === 'disputed' ? 'red' : 'amber')
        }))
      })
    }).catch(() => {
      this.showEmptySalary()
    })
  },

  confirmSalary() {
    if (!this.data.hasSalary) {
      wx.showToast({ title: '暂无可确认工资', icon: 'none' })
      return
    }

    api.confirmSalary(this.data.currentMonthValue).then(() => {
      wx.showToast({ title: '工资已确认', icon: 'none' })
      this.loadSalary()
    }).catch(() => {
      wx.showToast({ title: '确认失败', icon: 'none' })
    })
  },

  openDispute() {
    if (!this.data.hasSalary) {
      wx.showToast({ title: '暂无可异议工资', icon: 'none' })
      return
    }

    wx.navigateTo({
      url: `/pages/dispute/index?month=${encodeURIComponent(this.data.currentMonthValue)}`
    })
  },

  showEmptySalary() {
    this.setData({
      hasSalary: false,
      totalSalary: '¥0.00',
      confirmStatus: '暂无工资 · 等待报工通过后生成',
      confirmTone: 'gray',
      stats: [
        { label: '报工次数', value: '0', unit: '次', tone: 'blue' },
        { label: '总件数', value: '0', unit: '件', tone: 'green' },
        { label: '平均单价', value: '¥0.00', unit: '', tone: 'amber' }
      ],
      history: []
    })
  },

  exportReport() {
    wx.showToast({
      title: '导出工资报表',
      icon: 'none'
    })
  },

  formatAmount(cents) {
    return `¥${(Number(cents || 0) / 100).toFixed(2)}`
  },

  formatMonth(month) {
    const parts = String(month || '2026-06').split('-')
    return `${parts[0]}年${Number(parts[1] || 1)}月`
  }
})
