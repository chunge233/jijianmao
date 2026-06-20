const api = require('../../utils/api')

Page({
  data: {
    isEmpty: true,
    emptyTitle: '暂无报工详情',
    emptyDesc: '请从报工记录列表进入详情页。',
    reportId: '',
    title: '单工序报工',
    statusText: '待审核',
    statusTone: 'amber',
    createdAt: '',
    detail: {
      processName: '',
      price: '¥0.00',
      quantity: 0,
      amount: '¥0.00'
    },
    remark: '暂无备注',
    audit: [],
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

      const firstItem = report.items && report.items[0] ? report.items[0] : {}
      const status = this.statusInfo(report.status)

      this.setData({
        isEmpty: false,
        title: firstItem.processName || '单工序报工',
        statusText: status.text,
        statusTone: status.tone,
        createdAt: this.formatTime(report.createdAt),
        detail: {
          processName: firstItem.processName || '工序',
          price: this.formatAmount(firstItem.priceCents),
          quantity: firstItem.quantity || report.quantity || 0,
          amount: this.formatAmount(firstItem.subtotalCents || report.totalCents)
        },
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
      detail: {
        processName: '',
        price: '¥0.00',
        quantity: 0,
        amount: '¥0.00'
      },
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
