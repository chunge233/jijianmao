const api = require('../../utils/api')

Page({
  data: {
    isEmpty: true,
    emptyTitle: '暂无报工详情',
    emptyDesc: '请从报工记录列表进入详情页。',
    reportId: '',
    title: '工艺路线报工',
    statusText: '待审核',
    statusTone: 'amber',
    createdAt: '',
    stepCount: 0,
    totalQuantity: 0,
    totalAmount: '¥0.00',
    steps: [],
    remark: '暂无备注',
    audit: [
      { label: '报工人', value: '我' },
      { label: '审核状态', value: '待审核', tone: 'amber' }
    ],
    photos: []
  },

  onLoad(options) {
    this.setData({
      reportId: (options && options.id) || ''
    })
    this.loadReport()
  },

  loadReport() {
    if (!this.data.reportId) {
      this.showEmpty('暂无报工详情', '请从报工记录列表进入详情页。')
      return
    }

    api.getReport(this.data.reportId).then((report) => {
      if (!report) {
        this.showEmpty('未找到报工记录', '该记录可能已删除或不属于当前工厂。')
        return
      }

      const status = this.statusInfo(report.status)
      const steps = (report.items || []).map((item, index, list) => ({
        name: item.processName || '工序',
        price: this.formatAmount(item.priceCents),
        count: item.quantity || 0,
        amount: this.formatAmount(item.subtotalCents),
        terminal: index === list.length - 1
      }))

      this.setData({
        isEmpty: false,
        title: report.type === 'route' ? '工艺路线报工' : (steps[0] && steps[0].name) || '报工详情',
        statusText: status.text,
        statusTone: status.tone,
        createdAt: this.formatTime(report.createdAt),
        stepCount: steps.length,
        totalQuantity: report.quantity || 0,
        totalAmount: this.formatAmount(report.totalCents),
        steps,
        remark: report.remark || report.auditReason || '暂无备注',
        audit: [
          { label: '报工人', value: '我' },
          { label: '审核员', value: report.status === 'pending' ? '待分配' : '管理员' },
          { label: '审核状态', value: status.text, tone: status.tone },
          { label: '报工时间', value: this.formatTime(report.createdAt) }
        ]
      })
    }).catch(() => {
      this.showEmpty('报工详情加载失败', '请返回报工记录后重试。')
    })
  },

  showEmpty(title, desc) {
    this.setData({
      isEmpty: true,
      emptyTitle: title,
      emptyDesc: desc,
      title,
      statusText: '空',
      statusTone: 'gray',
      createdAt: '',
      stepCount: 0,
      totalQuantity: 0,
      totalAmount: '¥0.00',
      steps: [],
      remark: '暂无备注',
      audit: [],
      photos: []
    })
  },

  statusInfo(status) {
    return {
      approved: { text: '已通过', tone: 'green' },
      rejected: { text: '未通过', tone: 'red' },
      withdrawn: { text: '已撤回', tone: 'gray' },
      pending: { text: '待审核', tone: 'amber' }
    }[status] || { text: '待审核', tone: 'amber' }
  },

  formatAmount(cents) {
    return `¥${(Number(cents || 0) / 100).toFixed(2)}`
  },

  formatTime(value) {
    if (!value) {
      return ''
    }

    return value.replace('T', ' ').slice(0, 16)
  }
})
