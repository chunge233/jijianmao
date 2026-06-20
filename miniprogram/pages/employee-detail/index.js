const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')

const basePage = createPenPage(screens.employeeDetail)

function cloneScreen() {
  return JSON.parse(JSON.stringify(screens.employeeDetail))
}

Page({
  ...basePage,

  data: {
    screen: cloneScreen(),
    employeeId: ''
  },

  onLoad(options) {
    this.setData({
      employeeId: (options && options.id) || ''
    })
    this.loadEmployee()
  },

  handleAction(event) {
    const { action } = event.detail || {}

    if (action === 'disableEmployee') {
      this.disableEmployee()
      return
    }

    basePage.handleAction.call(this, event)
  },

  loadEmployee() {
    if (!this.data.employeeId) {
      this.showEmptyEmployee('缺少员工信息', '请从员工管理列表进入员工详情。')
      return
    }

    api.getEmployee(this.data.employeeId).then((employee) => {
      if (!employee) {
        this.showEmptyEmployee('未找到员工', '该员工可能已停用、删除或不属于当前工厂。')
        return
      }

      const roleText = {
        boss: '管理员',
        admin: '组长',
        employee: '员工'
      }[employee.role] || '员工'
      const screen = cloneScreen()

      screen.hero = {
        kicker: roleText,
        title: employee.name || '未命名员工',
        desc: `${this.maskPhone(employee.phone)} · ${employee.status === 'disabled' ? '已停用' : '在岗'}`,
        badge: employee.status === 'disabled' ? '停用' : '正常'
      }
      screen.sections = [
        {
          id: 'profile',
          type: 'list',
          title: '基础信息',
          items: [
            { title: '手机号', desc: this.maskPhone(employee.phone), value: employee.phone || '未绑定' },
            { title: '角色权限', desc: roleText, tag: employee.status === 'disabled' ? '停用' : '启用', tagTone: employee.status === 'disabled' ? 'gray' : 'green' },
            { title: '员工编号', desc: employee.id, value: '接口数据' }
          ]
        },
        {
          id: 'stats',
          type: 'metrics',
          title: '本月产出',
          items: [
            { label: '报工数量', value: '接口统计', tone: 'blue', short: '件' },
            { label: '计件工资', value: '按工资页核算', tone: 'green', short: '¥' }
          ]
        }
      ]
      screen.bottomActions = [
        { title: employee.status === 'disabled' ? '已停用' : '停用员工', type: 'secondary', action: 'disableEmployee' },
        { title: '编辑资料', path: `/pages/employee-new/index?id=${employee.id}` }
      ]

      this.setData({ screen })
    }).catch(() => {
      this.showEmptyEmployee('员工加载失败', '请返回员工管理后重试。')
    })
  },

  showEmptyEmployee(title, desc) {
    const screen = cloneScreen()
    screen.hero = {
      kicker: '员工详情',
      title,
      desc,
      badge: '空'
    }
    screen.sections = [
      {
        id: 'empty',
        type: 'empty',
        title,
        desc
      }
    ]
    screen.bottomActions = [
      { title: '返回员工管理', path: '/pages/employee/index' }
    ]
    this.setData({ screen })
  },

  disableEmployee() {
    if (!this.data.employeeId) {
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
