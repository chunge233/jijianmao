const api = require('../../utils/api')

Page({
  data: {
    month: '2026-06',
    monthText: '2026年6月',
    salaryAmount: '¥0.00',
    statusTitle: '准备提交异议',
    statusDesc: '请选择需要核对的报工并补充说明。',
    selectedType: 'quantity',
    types: [
      { id: 'quantity', label: '数量不符' },
      { id: 'price', label: '单价有误' },
      { id: 'missing', label: '漏算报工' },
      { id: 'other', label: '其他问题' }
    ],
    relatedReports: [],
    selectedReportCount: 0,
    reasonText: '',
    timeline: [
      { title: '填写异议信息', time: '当前步骤', active: true },
      { title: '管理员核实', time: '提交后进入处理', active: false },
      { title: '同步处理结果', time: '处理后发送消息提醒', active: false }
    ]
  },

  onLoad(options) {
    if (options && options.month) {
      const month = decodeURIComponent(options.month)
      this.setData({
        month,
        monthText: this.formatMonth(month)
      })
    }

    this.loadSalaryReports()
  },

  onShow() {
    this.loadSalaryReports()
  },

  selectType(event) {
    const { id } = event.currentTarget.dataset

    this.setData({
      selectedType: id
    })
  },

  toggleReport(event) {
    const { id } = event.currentTarget.dataset
    const relatedReports = this.data.relatedReports.map((item) => {
      if (item.id !== id) {
        return item
      }

      return {
        ...item,
        selected: !item.selected
      }
    })
    const selectedReportCount = relatedReports.filter((item) => item.selected).length

    this.setData({
      relatedReports,
      selectedReportCount
    })
  },

  onReasonInput(event) {
    this.setData({
      reasonText: event.detail.value
    })
  },

  submitDispute() {
    if (this.data.selectedReportCount === 0) {
      wx.showToast({
        title: '请至少关联一条报工',
        icon: 'none'
      })
      return
    }

    const typeLabel = (this.data.types.find((item) => item.id === this.data.selectedType) || {}).label || '工资异议'
    const selectedReports = this.data.relatedReports.filter((item) => item.selected)
    const reason = [
      typeLabel,
      this.data.reasonText || '请管理员核对所选报工记录。',
      `关联报工：${selectedReports.map((item) => item.title).join('、')}`
    ].join('；')

    api.disputeSalary(this.data.month, reason).then(() => {
      wx.showToast({
        title: '异议已提交',
        icon: 'none'
      })
      this.setData({
        statusTitle: '异议已提交',
        statusDesc: '管理员核实后会通过消息通知你。',
        timeline: [
          { title: '提交异议申请', time: '刚刚', active: true },
          { title: '管理员核实', time: '处理中', active: true },
          { title: '同步处理结果', time: '处理后发送消息提醒', active: false }
        ]
      })
    }).catch(() => {
      wx.showToast({
        title: '异议提交失败',
        icon: 'none'
      })
    })
  },

  loadSalaryReports() {
    api.getSalaryMonth(this.data.month).then((res) => {
      const items = res && Array.isArray(res.items) ? res.items : []
      const reports = items.map((item, index) => {
        const title = item.processName || item.reportId || '报工记录'
        return {
          id: `${item.reportId || 'report'}_${item.processId || index}`,
          title,
          meta: `${Number(item.quantity || 0)} 件 · 单价 ${this.formatAmount(item.priceCents)}`,
          amount: `+${this.formatAmount(item.subtotalCents)}`,
          selected: true
        }
      })

      this.setData({
        salaryAmount: this.formatAmount(res && res.totalCents),
        relatedReports: reports,
        selectedReportCount: reports.length
      })
    }).catch(() => {
      this.setData({
        salaryAmount: '¥0.00',
        relatedReports: [],
        selectedReportCount: 0
      })
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
