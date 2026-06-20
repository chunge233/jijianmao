const api = require('../../utils/api')

Page({
  data: {
    isEmpty: true,
    emptyTitle: '暂无工资数据',
    emptyDesc: '当前月份还没有已通过的报工记录。',
    month: '2026-06',
    monthText: '2026年6月工资',
    totalAmount: '¥0.00',
    stats: [
      { label: '报工次数', value: '0次', tone: 'blue' },
      { label: '总件数', value: '0件', tone: 'green' },
      { label: '平均单价', value: '¥0.00', tone: 'amber' }
    ],
    details: []
  },

  onLoad(options) {
    if (options && options.month) {
      this.setData({
        month: decodeURIComponent(options.month)
      })
    }

    this.loadSalaryDetail()
  },

  onShow() {
    this.loadSalaryDetail()
  },

  loadSalaryDetail() {
    api.getSalaryMonth(this.data.month).then((res) => {
      if (!res || !Array.isArray(res.items)) {
        this.showEmpty('暂无工资数据', '当前月份还没有工资明细。')
        return
      }

      const quantity = res.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
      const grouped = {}

      res.items.forEach((item) => {
        const key = item.processName || '工序'
        if (!grouped[key]) {
          grouped[key] = { count: 0, quantity: 0, amountCents: 0 }
        }
        grouped[key].count += 1
        grouped[key].quantity += Number(item.quantity || 0)
        grouped[key].amountCents += Number(item.subtotalCents || 0)
      })

      const colors = ['#1A56DB', '#059669', '#7C3AED', '#D97706']
      const details = Object.keys(grouped).map((name, index) => ({
        color: colors[index % colors.length],
        name,
        meta: `${grouped[name].count}单 · ${grouped[name].quantity}件`,
        amount: `¥${(grouped[name].amountCents / 100).toFixed(2)}`
      }))

      this.setData({
        isEmpty: details.length === 0,
        emptyTitle: '暂无工资明细',
        emptyDesc: '当前月份还没有已通过的报工记录。',
        monthText: this.formatMonth(res.month),
        totalAmount: `¥${(Number(res.totalCents || 0) / 100).toFixed(2)}`,
        stats: [
          { label: '报工次数', value: `${res.items.length}次`, tone: 'blue' },
          { label: '总件数', value: `${quantity}件`, tone: 'green' },
          { label: '平均单价', value: quantity ? `¥${(Number(res.totalCents || 0) / quantity / 100).toFixed(2)}` : '¥0.00', tone: 'amber' }
        ],
        details
      })
    }).catch(() => {
      this.showEmpty('工资加载失败', '请稍后返回工资页重试。')
    })
  },

  openBreakdown() {
    wx.navigateTo({
      url: `/pages/salary-breakdown/index?month=${encodeURIComponent(this.data.month)}`
    })
  },

  confirmSalary() {
    if (this.data.isEmpty) {
      wx.showToast({ title: '暂无可确认工资', icon: 'none' })
      return
    }

    api.confirmSalary(this.data.month).then(() => {
      wx.navigateTo({
        url: '/pages/salary-confirm-success/index'
      })
    }).catch(() => {
      wx.showToast({ title: '确认失败', icon: 'none' })
    })
  },

  openDispute() {
    if (this.data.isEmpty) {
      wx.showToast({ title: '暂无可异议工资', icon: 'none' })
      return
    }

    wx.navigateTo({
      url: `/pages/dispute/index?month=${encodeURIComponent(this.data.month)}`
    })
  },

  showEmpty(title, desc) {
    this.setData({
      isEmpty: true,
      emptyTitle: title,
      emptyDesc: desc,
      totalAmount: '¥0.00',
      stats: [
        { label: '报工次数', value: '0次', tone: 'blue' },
        { label: '总件数', value: '0件', tone: 'green' },
        { label: '平均单价', value: '¥0.00', tone: 'amber' }
      ],
      details: []
    })
  },

  formatMonth(month) {
    const parts = String(month || this.data.month).split('-')
    return `${parts[0]}年${Number(parts[1] || 1)}月工资`
  }
})
