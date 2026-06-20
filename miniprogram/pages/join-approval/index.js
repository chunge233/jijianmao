const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')

const basePage = createPenPage(screens.joinApproval)

function cloneScreen() {
  return JSON.parse(JSON.stringify(screens.joinApproval))
}

Page({
  ...basePage,

  data: {
    screen: cloneScreen(),
    currentApplicationId: ''
  },

  onLoad() {
    this.loadApplications()
  },

  onShow() {
    this.loadApplications()
  },

  handleAction(event) {
    const { action } = event.detail || {}

    if (action === 'approve') {
      this.reviewApplication(true)
      return
    }

    if (action === 'reject') {
      this.reviewApplication(false)
      return
    }

    basePage.handleAction.call(this, event)
  },

  loadApplications() {
    api.getJoinApplications().then((applications) => {
      if (!Array.isArray(applications) || applications.length === 0) {
        const screen = cloneScreen()
        screen.sections = [
          {
            id: 'empty',
            type: 'empty',
            title: '暂无加入申请',
            desc: '成员通过邀请码申请加入后，会在这里等待审批。'
          }
        ]
        screen.bottomActions = []
        this.setData({
          screen,
          currentApplicationId: ''
        })
        return
      }

      const pending = applications.find((item) => item.status === 'pending')
      const screen = cloneScreen()
      screen.sections = [
        {
          id: 'applications',
          type: 'cards',
          title: '申请列表',
          items: applications.map((item) => ({
            title: `${item.name} 申请加入`,
            desc: `手机号 ${this.maskPhone(item.phone)} · 申请角色：${item.role === 'admin' ? '组长' : '员工'}`,
            tag: item.status === 'pending' ? '待审批' : (item.status === 'approved' ? '已同意' : '已拒绝'),
            tagTone: item.status === 'pending' ? 'amber' : (item.status === 'approved' ? 'green' : 'red'),
            meta: [
              { label: '申请时间', value: this.formatTime(item.createdAt) },
              { label: '来源', value: '邀请码' }
            ]
          }))
        }
      ]
      screen.bottomActions = pending ? screen.bottomActions : []

      this.setData({
        screen,
        currentApplicationId: pending ? pending.id : ''
      })
    }).catch(() => {})
  },

  reviewApplication(approved) {
    if (!this.data.currentApplicationId) {
      wx.showToast({ title: '暂无待审批申请', icon: 'none' })
      return
    }

    const request = approved
      ? api.approveJoinApplication(this.data.currentApplicationId)
      : api.rejectJoinApplication(this.data.currentApplicationId)

    request.then(() => {
      wx.showToast({ title: approved ? '已同意加入' : '已拒绝申请', icon: 'none' })
      this.loadApplications()
    }).catch(() => {
      wx.showToast({ title: '审批接口不可用', icon: 'none' })
    })
  },

  maskPhone(phone) {
    if (!phone || phone.length < 7) {
      return phone || '未绑定'
    }

    return `${phone.slice(0, 3)}****${phone.slice(-4)}`
  },

  formatTime(value) {
    if (!value) {
      return ''
    }

    return value.replace('T', ' ').slice(5, 16)
  }
})
