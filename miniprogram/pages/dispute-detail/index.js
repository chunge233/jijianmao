const api = require('../../utils/api')

Page({
  data: {
    disputeId: '',
    month: '2026-06',
    monthText: '2026年6月',
    statusTitle: '暂无异议记录',
    statusDesc: '没有找到对应的工资异议。',
    salaryAmount: '¥0.00',
    reasonText: '暂无异议说明。',
    isEmpty: true,
    timeline: [
      { title: '提交异议申请', time: '等待提交', active: false },
      { title: '管理员核实', time: '待处理', active: false },
      { title: '同步处理结果', time: '待通知', active: false }
    ]
  },

  onLoad(options) {
    this.setData({
      disputeId: options && options.id ? decodeURIComponent(options.id) : '',
      month: options && options.month ? decodeURIComponent(options.month) : this.data.month,
      monthText: this.formatMonth(options && options.month ? decodeURIComponent(options.month) : this.data.month)
    })
    this.loadDispute()
  },

  onShow() {
    this.loadDispute()
  },

  loadDispute() {
    api.getSalaryConfirmations(this.data.month).then((res) => {
      const employees = res && Array.isArray(res.employees) ? res.employees : []
      const dispute = employees.find((item) => item.id === this.data.disputeId && item.status === '异议中')

      if (!dispute) {
        this.showEmpty()
        return
      }

      this.setData({
        isEmpty: false,
        statusTitle: '异议处理中',
        statusDesc: `${dispute.name || '员工'}的工资异议待核实。`,
        salaryAmount: this.formatAmount(dispute.amountCents),
        reasonText: '员工已提交工资确认异议，请结合报工记录、工价和数量进行核对。',
        timeline: [
          { title: '提交异议申请', time: this.data.monthText, active: true },
          { title: '管理员核实', time: '处理中', active: true },
          { title: '同步处理结果', time: '处理后发送消息提醒', active: false }
        ]
      })
    }).catch(() => {
      this.showEmpty('异议详情加载失败', '请稍后返回列表重试。')
    })
  },

  showEmpty(title = '暂无异议记录', desc = '没有找到对应的工资异议。') {
    this.setData({
      isEmpty: true,
      statusTitle: title,
      statusDesc: desc,
      salaryAmount: '¥0.00',
      reasonText: desc,
      timeline: [
        { title: '提交异议申请', time: '无记录', active: false },
        { title: '管理员核实', time: '待处理', active: false },
        { title: '同步处理结果', time: '待通知', active: false }
      ]
    })
  },

  formatAmount(cents) {
    return `¥${(Number(cents || 0) / 100).toFixed(2)}`
  },

  formatMonth(month) {
    const parts = String(month || this.data.month).split('-')
    return `${parts[0]}年${Number(parts[1] || 1)}月`
  }
})
