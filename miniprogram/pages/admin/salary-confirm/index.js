Page({
  data: {
    tabs: [
      { label: '待确认', active: true },
      { label: '已确认' },
      { label: '异议中' }
    ],
    employees: [
      { name: '张伟', team: '一组', amount: '¥2,580.00', status: '待确认', tone: 'amber' },
      { name: '李娜', team: '一组', amount: '¥2,340.00', status: '已确认', tone: 'green' },
      { name: '王强', team: '二组', amount: '¥2,150.00', status: '异议中', tone: 'red' }
    ]
  },

  remind() {
    wx.showToast({ title: '已发送催确认提醒', icon: 'none' })
  }
})
