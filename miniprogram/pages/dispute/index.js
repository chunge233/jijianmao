Page({
  data: {
    selectedType: 'quantity',
    types: [
      { id: 'quantity', label: '数量不符' },
      { id: 'price', label: '单价有误' },
      { id: 'missing', label: '漏算报工' },
      { id: 'other', label: '其他问题' }
    ],
    relatedReports: [
      { id: 'R001', title: '产品质检', meta: '30 件 · 今天 14:30', amount: '+¥10.50', selected: true },
      { id: 'R002', title: '零件装配路线', meta: '50 件 · 今天 10:15', amount: '+¥15.00', selected: true },
      { id: 'R003', title: '包装检验', meta: '40 件 · 昨天 16:00', amount: '+¥8.00', selected: false }
    ],
    selectedReportCount: 2,
    timeline: [
      { title: '提交异议申请', time: '6月15日 14:30', active: true },
      { title: '管理员已确认，待核实', time: '6月15日 16:00', active: true },
      { title: '预计处理结果', time: '预计6月18日前', active: false }
    ]
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

  submitDispute() {
    if (this.data.selectedReportCount === 0) {
      wx.showToast({
        title: '请至少关联一条报工',
        icon: 'none'
      })
      return
    }

    wx.showToast({
      title: '异议已提交',
      icon: 'none'
    })
  }
})
