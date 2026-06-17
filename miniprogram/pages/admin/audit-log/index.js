Page({
  data: {
    chips: ['全部', '员工', '工价', '权限', '数据'],
    logs: [
      { id: 'L001', tone: 'blue', user: '陈经理', action: '调整工序单价', detail: '裁剪 ¥0.40 → ¥0.45', time: '今天 11:20' },
      { id: 'L002', tone: 'green', user: '赵文员', action: '通过加入申请', detail: '周玲 加入一组', time: '今天 09:50' },
      { id: 'L003', tone: 'amber', user: '系统', action: '自动备份完成', detail: '备份大小 18.2MB', time: '昨天 23:00' }
    ]
  },

  openDetail(event) {
    wx.navigateTo({ url: `/pages/admin/audit-log-detail/index?id=${event.currentTarget.dataset.id}` })
  }
})
