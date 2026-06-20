const api = require('../../utils/api')

Page({
  data: {
    filters: ['全部', '组长', '工人', '管理员'],
    activeFilter: '全部',
    allRoles: [
      { name: '管理员', count: '2人', summary: '全部权限 · 工厂设置 · 数据查看', color: '#7C3AED' },
      { name: '组长', count: '3人', summary: '报工审核 · 员工管理 · 数据查看', color: '#2563EB' },
      { name: '工人', count: '15人', summary: '报工 · 查看工资 · 提交异议', color: '#059669' },
      { name: '财务', count: '1人', summary: '工资报表 · 数据看板 · 导出', color: '#D97706' }
    ],
    roles: []
  },

  onLoad() {
    this.filterRoles('全部')
    this.loadRoles()
  },

  onShow() {
    this.loadRoles()
  },

  switchFilter(event) {
    const { filter } = event.currentTarget.dataset
    this.filterRoles(filter)
  },

  filterRoles(filter) {
    const roles = filter === '全部'
      ? this.data.allRoles
      : this.data.allRoles.filter((item) => item.name === filter)

    this.setData({
      activeFilter: filter,
      roles
    })
  },

  openRole(event) {
    const { id, name } = event.currentTarget.dataset

    wx.navigateTo({
      url: `/pages/permission-detail/index?id=${id || name || ''}`
    })
  },

  addRole() {
    wx.navigateTo({
      url: '/pages/role-edit/index'
    })
  },

  loadRoles() {
    api.getRoles().then((roles) => {
      if (!Array.isArray(roles) || roles.length === 0) {
        return
      }

      const colors = ['#7C3AED', '#2563EB', '#059669', '#D97706']
      this.setData({
        allRoles: roles.map((role, index) => ({
          id: role.id,
          name: role.name,
          count: `${role.count || 0}人`,
          summary: role.summary,
          color: colors[index % colors.length]
        }))
      })
      this.filterRoles(this.data.activeFilter)
    }).catch(() => {})
  }
})
