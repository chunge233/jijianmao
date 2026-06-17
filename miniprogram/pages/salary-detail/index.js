Page({
  data: {
    stats: [
      { label: '报工次数', value: '128次', tone: 'blue' },
      { label: '总件数', value: '1,560件', tone: 'green' },
      { label: '平均单价', value: '¥1.65', tone: 'amber' }
    ],
    details: [
      { color: '#1A56DB', name: '切割', meta: '3单 · 560件', amount: '¥196.00' },
      { color: '#059669', name: '钻孔', meta: '2单 · 380件', amount: '¥152.00' },
      { color: '#7C3AED', name: '质检', meta: '2单 · 620件', amount: '¥186.00' },
      { color: '#D97706', name: '装配', meta: '2单 · 220件', amount: '¥110.00' }
    ]
  },

  openBreakdown() {
    wx.navigateTo({
      url: '/pages/salary-breakdown/index'
    })
  },

  openDispute() {
    wx.navigateTo({
      url: '/pages/dispute/index'
    })
  }
})
