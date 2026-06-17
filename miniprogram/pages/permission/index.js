Page({
  data: {
    filters: ['全部', '组长', '工人', '管理员'],
    roles: [
      { name: '管理员', count: '2人', summary: '全部权限 · 工厂设置 · 数据查看', color: '#7C3AED' },
      { name: '组长', count: '3人', summary: '报工审核 · 员工管理 · 数据查看', color: '#2563EB' },
      { name: '工人', count: '15人', summary: '报工 · 查看工资 · 提交异议', color: '#059669' },
      { name: '财务', count: '1人', summary: '工资报表 · 数据看板 · 导出', color: '#D97706' }
    ]
  },

  openRole(event) {
    const { name } = event.currentTarget.dataset

    wx.showToast({
      title: `编辑${name}权限`,
      icon: 'none'
    })
  },

  addRole() {
    wx.showToast({
      title: '新增角色',
      icon: 'none'
    })
  }
})
