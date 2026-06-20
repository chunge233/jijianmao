const api = require('../../utils/api')

Page({
  data: {
    employeeId: '',
    name: '',
    phone: '',
    role: 'employee',
    roles: [
      { label: '员工', value: 'employee' },
      { label: '组长', value: 'admin' },
      { label: '管理员', value: 'boss' }
    ],
    saving: false
  },

  onLoad(options) {
    const employeeId = (options && options.id) || ''
    this.setData({ employeeId })

    if (employeeId) {
      this.loadEmployee(employeeId)
    }
  },

  loadEmployee(employeeId) {
    api.getEmployee(employeeId).then((employee) => {
      if (!employee) {
        return
      }

      this.setData({
        name: employee.name || '',
        phone: employee.phone || '',
        role: employee.role || 'employee'
      })
    }).catch(() => {})
  },

  onNameInput(event) {
    this.setData({ name: event.detail.value || '' })
  },

  onPhoneInput(event) {
    this.setData({ phone: event.detail.value || '' })
  },

  selectRole(event) {
    this.setData({ role: event.currentTarget.dataset.role })
  },

  saveEmployee() {
    const name = this.data.name.trim()
    const phone = this.data.phone.trim()

    if (!name) {
      wx.showToast({ title: '请输入员工姓名', icon: 'none' })
      return
    }

    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    const payload = {
      name,
      phone,
      role: this.data.role
    }
    const request = this.data.employeeId
      ? api.updateEmployee(this.data.employeeId, payload)
      : api.createEmployee(payload)

    request.then(() => {
      this.setData({ saving: false })
      wx.showToast({ title: '员工已保存', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 450)
    }).catch((error) => {
      this.setData({ saving: false })
      wx.showToast({ title: error.message || '保存失败', icon: 'none' })
    })
  }
})
