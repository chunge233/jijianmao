Page({
  data: {
    audits: [
      { name: '张伟', initial: '张', color: '#3B82F6', code: 'JK-2023', process: '裁剪工序', count: '200件', time: '14:30' },
      { name: '李娜', initial: '李', color: '#6366F1', code: 'XS-1002', process: '缝合工序', count: '150件', time: '15:15' },
      { name: '王强', initial: '王', color: '#60A5FA', code: 'HD-881', process: '包装工序', count: '80件', time: '11:00' },
      { name: '陈敏', initial: '陈', color: '#3B82F6', code: 'PN-205', process: '质检工序', count: '300件', time: '昨天' },
      { name: '刘洋', initial: '刘', color: '#60A5FA', code: 'JK-2023', process: '裁剪工序', count: '180件', time: '昨天' },
      { name: '赵磊', initial: '赵', color: '#60A5FA', code: 'XS-1002', process: '烫熨工序', count: '220件', time: '昨天' }
    ]
  },

  openDetail() {
    wx.navigateTo({
      url: '/pages/audit-detail/index'
    })
  }
})
