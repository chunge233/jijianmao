const api = require('../../utils/api')

Page({
  data: {
    employeeId: '',
    employee: null,
    emptyState: null,
    loading: true
  },

  onLoad(options) {
    this.setData({
      employeeId: (options && options.id) || ''
    })
    this.loadEmployee()
  },

  loadEmployee() {
    if (!this.data.employeeId) {
      this.showEmptyEmployee('缺少员工信息', '请从员工管理列表进入员工详情。')
      return
    }

    this.setData({
      loading: true,
      emptyState: null
    })

    api.getEmployee(this.data.employeeId).then((employee) => {
      if (!employee) {
        this.showEmptyEmployee('未找到员工', '该员工可能已停用、删除或不属于当前工厂。')
        return
      }

      this.setData({
        employee: this.normalizeEmployee(employee),
        loading: false
      })
    }).catch(() => {
      this.showEmptyEmployee('员工加载失败', '请返回员工管理后重试。')
    })
  },

  normalizeEmployee(employee) {
    const name = employee.name || '未命名员工'
    const disabled = employee.status === 'disabled'

    return {
      id: employee.id || '',
      name,
      initial: name.slice(0, 1),
      roleText: this.roleText(employee.role),
      phoneValue: employee.phone || '未绑定手机',
      maskedPhone: this.maskPhone(employee.phone),
      statusText: disabled ? '已停用' : '在岗',
      statusClass: disabled ? 'is-disabled' : 'is-active',
      disableTitle: disabled ? '已停用' : '停用员工'
    }
  },

  roleText(role) {
    const roleMap = {
      boss: '管理员',
      admin: '管理员',
      employee: '工人'
    }

    return roleMap[role] || '工人'
  },

  showEmptyEmployee(title, desc) {
    this.setData({
      employee: null,
      emptyState: { title, desc },
      loading: false
    })
  },

  openEdit() {
    if (!this.data.employeeId) {
      return
    }

    wx.navigateTo({
      url: `/pages/employee-new/index?id=${this.data.employeeId}`
    })
  },

  backToList() {
    wx.redirectTo({
      url: '/pages/employee/index'
    })
  },

  disableEmployee() {
    const employee = this.data.employee

    if (!this.data.employeeId || !employee || employee.statusClass === 'is-disabled') {
      return
    }

    wx.showModal({
      title: '确认停用员工？',
      content: '停用后员工无法继续报工。',
      confirmText: '停用',
      success: (res) => {
        if (!res.confirm) {
          return
        }

        api.disableEmployee(this.data.employeeId).then(() => {
          wx.showToast({ title: '已停用员工', icon: 'none' })
          this.loadEmployee()
        }).catch(() => {
          wx.showToast({ title: '停用失败', icon: 'none' })
        })
      }
    })
  },

  maskPhone(phone) {
    if (!phone || phone.length < 7) {
      return phone || '未绑定手机'
    }

    return `${phone.slice(0, 3)}****${phone.slice(-4)}`
  }
})
