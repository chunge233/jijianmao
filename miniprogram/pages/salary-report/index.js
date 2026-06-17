Page({
  data: {
    stats: [
      { label: '报工次数', value: '356', unit: '次', tone: 'blue' },
      { label: '总件数', value: '18,650', unit: '件', tone: 'green' },
      { label: '平均单价', value: '¥0.92', unit: '', tone: 'amber' }
    ],
    history: [
      { month: '2026年5月', amount: '¥26,880.00', status: '已导出', tone: 'green' },
      { month: '2026年4月', amount: '¥25,430.00', status: '有异议', tone: 'red' },
      { month: '2026年3月', amount: '¥27,600.00', status: '已导出', tone: 'green' }
    ]
  },

  exportReport() {
    wx.showToast({
      title: '导出工资报表',
      icon: 'none'
    })
  }
})
