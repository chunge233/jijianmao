const api = require('../../utils/api')

Page({
  data: {
    topTabs: [],
    roles: ['全部', '班长', '工人', '管理员'],
    activeStatus: 'online',
    activeRole: '全部',
    allEmployees: [],
    employees: []
  },

  onLoad() {
    this.filterEmployees('online', '全部')
    this.loadEmployees()
  },

  onShow() {
    this.loadEmployees()
  },

  switchStatus(event) {
    const { status } = event.currentTarget.dataset
    this.filterEmployees(status, this.data.activeRole)
  },

  switchRole(event) {
    const { role } = event.currentTarget.dataset
    this.filterEmployees(this.data.activeStatus, role)
  },

  normalizeRole(role) {
    return role === '班长' ? '组长' : role
  },

  buildTopTabs(activeStatus) {
    const onlineCount = this.data.allEmployees.filter((item) => item.tag === '在线').length
    const leftCount = this.data.allEmployees.filter((item) => item.tag === '离职').length

    return [
      { label: '在线', status: 'online', count: onlineCount, active: activeStatus === 'online' },
      { label: '离职', status: 'left', count: leftCount, active: activeStatus === 'left' }
    ]
  },

  filterEmployees(status, role) {
    const normalizedRole = this.normalizeRole(role)
    const statusLabel = status === 'left' ? '离职' : '在线'
    const employees = this.data.allEmployees.filter((item) => {
      const statusMatched = item.tag === statusLabel
      const roleMatched = role === '全部' || item.role === normalizedRole

      return statusMatched && roleMatched
    })

    this.setData({
      activeStatus: status,
      activeRole: role,
      topTabs: this.buildTopTabs(status),
      employees
    })
  },

  openEmployeeDetail(event) {
    const { id } = event.currentTarget.dataset

    wx.navigateTo({
      url: `/pages/employee-detail/index${id ? `?id=${id}` : ''}`
    })
  },

  loadEmployees() {
    api.getEmployees().then((employees) => {
      this.setData({
        allEmployees: Array.isArray(employees) ? employees.map((employee, index) => this.normalizeEmployee(employee, index)) : []
      })
      this.filterEmployees(this.data.activeStatus, this.data.activeRole)
    }).catch(() => {})
  },

  normalizeEmployee(employee, index) {
    const roleMap = {
      boss: '管理员',
      admin: '管理员',
      employee: '工人'
    }
    const colors = ['#2563EB', '#16A34A', '#EA580C', '#7C3AED', '#E11D48', '#0891B2']
    const name = employee.name || '未命名'

    return {
      id: employee.id,
      name,
      initial: name.slice(0, 1),
      role: roleMap[employee.role] || '工人',
      phone: this.maskPhone(employee.phone),
      tag: employee.status === 'disabled' ? '离职' : '在线',
      color: colors[index % colors.length]
    }
  },

  maskPhone(phone) {
    if (!phone || phone.length < 7) {
      return phone || '未绑定手机'
    }

    return `${phone.slice(0, 3)}****${phone.slice(-4)}`
  }
})
