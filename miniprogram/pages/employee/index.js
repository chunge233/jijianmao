Page({
  data: {
    roles: ['全部', '班长', '工人', '管理员'],
    employees: [
      { name: '张伟', initial: '张', role: '组长', phone: '138****6789', tag: '在线', color: '#2563EB' },
      { name: '李娜', initial: '李', role: '工人', phone: '139****8901', tag: '在线', color: '#16A34A' },
      { name: '王强', initial: '王', role: '工人', phone: '137****2345', tag: '在线', color: '#EA580C' },
      { name: '陈敏', initial: '陈', role: '工人', phone: '136****5678', tag: '在线', color: '#7C3AED' },
      { name: '刘洋', initial: '刘', role: '工人', phone: '135****9012', tag: '在线', color: '#E11D48' },
      { name: '赵磊', initial: '赵', role: '离职', phone: '133****3456', tag: '离职', color: '#374151' }
    ]
  },

  openEmployeeDetail() {
    wx.navigateTo({
      url: '/pages/employee-detail/index'
    })
  }
})
