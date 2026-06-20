const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')

const basePage = createPenPage(screens.employeeDisableConfirm)

Page({
  ...basePage,

  data: {
    ...basePage.data,
    employeeId: ''
  },

  onLoad(options) {
    this.setData({
      employeeId: (options && options.id) || ''
    })
  },

  handleAction(event) {
    const { action } = event.detail || {}

    if (action === 'disableEmployee') {
      this.disableEmployee()
      return
    }

    basePage.handleAction.call(this, event)
  },

  disableEmployee() {
    if (!this.data.employeeId) {
      wx.showToast({ title: '缺少员工信息', icon: 'none' })
      return
    }

    api.disableEmployee(this.data.employeeId).then(() => {
      this.toastAndBack('已停用员工')
    }).catch(() => {
      wx.showToast({ title: '停用失败', icon: 'none' })
    })
  }
})
