const api = require('../../utils/api')

Page({
  data: {
    isEmpty: true,
    emptyTitle: '暂无工资明细',
    emptyDesc: '当前月份还没有已通过的报工记录。',
    monthValue: '2026-06',
    month: '2026年6月',
    totalAmount: '¥0.00',
    sections: []
  },

  onLoad(options) {
    if (options && options.month) {
      const monthValue = decodeURIComponent(options.month)
      this.setData({
        monthValue,
        month: this.formatMonth(monthValue)
      })
    }

    this.loadBreakdown()
  },

  onShow() {
    this.loadBreakdown()
  },

  loadBreakdown() {
    api.getSalaryMonth(this.data.monthValue).then((res) => {
      if (!res || !Array.isArray(res.items)) {
        this.showEmpty('暂无工资明细', '当前月份还没有工资明细。')
        return
      }

      const colors = ['#1A56DB', '#059669', '#7C3AED', '#D97706']
      const grouped = {}

      res.items.forEach((item) => {
        const name = item.processName || '工序'
        if (!grouped[name]) {
          grouped[name] = {
            quantity: 0,
            totalCents: 0,
            rows: []
          }
        }
        grouped[name].quantity += Number(item.quantity || 0)
        grouped[name].totalCents += Number(item.subtotalCents || 0)
        grouped[name].rows.push({
          no: item.reportId || '报工单',
          type: '计件',
          count: `${item.quantity || 0}件`,
          price: this.formatAmount(item.priceCents),
          amount: this.formatAmount(item.subtotalCents)
        })
      })

      const sections = Object.keys(grouped).map((name, index) => ({
        name,
        color: colors[index % colors.length],
        meta: `${grouped[name].rows.length}单 · ${grouped[name].quantity}件`,
        total: this.formatAmount(grouped[name].totalCents),
        rows: grouped[name].rows
      }))

      this.setData({
        isEmpty: sections.length === 0,
        emptyTitle: '暂无工资明细',
        emptyDesc: '当前月份还没有已通过的报工记录。',
        month: this.formatMonth(res.month),
        totalAmount: this.formatAmount(res.totalCents),
        sections
      })
    }).catch(() => {
      this.showEmpty('工资明细加载失败', '请稍后返回工资页重试。')
    })
  },

  showEmpty(title, desc) {
    this.setData({
      isEmpty: true,
      emptyTitle: title,
      emptyDesc: desc,
      totalAmount: '¥0.00',
      sections: []
    })
  },

  formatAmount(cents) {
    return `¥${(Number(cents || 0) / 100).toFixed(2)}`
  },

  formatMonth(month) {
    const parts = String(month || this.data.monthValue).split('-')
    return `${parts[0]}年${Number(parts[1] || 1)}月`
  }
})
