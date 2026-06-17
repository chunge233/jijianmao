Page({
  data: {
    rows: [
      { title: '报工待审核提醒', desc: '有新报工时通知组长', enabled: true },
      { title: '工资确认提醒', desc: '月底提醒员工确认工资', enabled: true },
      { title: '异议处理提醒', desc: '员工提交异议后通知管理员', enabled: true },
      { title: '备份异常提醒', desc: '数据备份失败时通知负责人', enabled: false }
    ]
  },

  toggle(event) {
    const index = Number(event.currentTarget.dataset.index)
    const rows = this.data.rows.map((item, rowIndex) => rowIndex === index ? { ...item, enabled: !item.enabled } : item)
    this.setData({ rows })
  }
})
