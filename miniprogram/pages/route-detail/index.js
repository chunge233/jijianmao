const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')

const basePage = createPenPage(screens.routeDetail)

function cloneScreen() {
  return JSON.parse(JSON.stringify(screens.routeDetail))
}

Page({
  ...basePage,

  data: {
    screen: cloneScreen(),
    routeId: ''
  },

  onLoad(options) {
    this.setData({
      routeId: (options && options.id) || ''
    })
    this.loadRoute()
  },

  handleAction(event) {
    const { action } = event.detail || {}

    if (action === 'disableRoute') {
      this.disableRoute()
      return
    }

    basePage.handleAction.call(this, event)
  },

  loadRoute() {
    if (!this.data.routeId) {
      this.showEmptyRoute('缺少路线信息', '请从工艺路线列表进入路线详情。')
      return
    }

    api.getRoute(this.data.routeId).then((route) => {
      if (!route) {
        this.showEmptyRoute('未找到路线', '该路线可能已停用、删除或不属于当前工厂。')
        return
      }

      const processes = (route.processes || []).filter(Boolean)
      const totalCents = processes.reduce((sum, item) => sum + Number(item.priceCents || 0), 0)
      const screen = cloneScreen()

      screen.hero = {
        kicker: route.qrCode || '路线二维码',
        title: route.name || '工艺路线',
        desc: `${processes.length}道工序 · 单件合计 ${this.formatAmount(totalCents)}`,
        badge: route.status === 'disabled' ? '停用' : '启用'
      }
      screen.sections = [
        {
          id: 'steps',
          type: 'steps',
          title: '工序流程',
          items: processes.map((process, index) => ({
            title: process.name,
            desc: `${this.formatAmount(process.priceCents)}/件 · 第 ${index + 1} 道`
          }))
        },
        {
          id: 'setting',
          type: 'list',
          title: '路线设置',
          items: [
            { title: '路线二维码', desc: route.qrCode || '未生成', value: '扫码报工' },
            { title: '报工方式', desc: '扫码后自动带出全部工序', tag: '开启', tagTone: 'green' }
          ]
        }
      ]
      screen.bottomActions = [
        { title: route.status === 'disabled' ? '已停用' : '停用路线', type: 'secondary', action: 'disableRoute' },
        { title: '编辑路线', path: `/pages/route-edit/index?id=${route.id}` }
      ]

      this.setData({ screen })
    }).catch(() => {
      this.showEmptyRoute('路线加载失败', '请返回工艺路线列表后重试。')
    })
  },

  showEmptyRoute(title, desc) {
    const screen = cloneScreen()
    screen.hero = {
      kicker: '工艺路线详情',
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
      { title: '返回工艺路线', path: '/pages/route-manage/index' }
    ]
    this.setData({ screen })
  },

  disableRoute() {
    if (!this.data.routeId) {
      return
    }

    wx.showModal({
      title: '停用路线？',
      content: '停用后扫码路线将不再用于新报工。',
      confirmText: '停用',
      success: (res) => {
        if (!res.confirm) {
          return
        }

        api.deleteRoute(this.data.routeId).then(() => {
          wx.showToast({ title: '已停用', icon: 'none' })
          this.loadRoute()
        }).catch(() => {
          wx.showToast({ title: '停用失败', icon: 'none' })
        })
      }
    })
  },

  formatAmount(cents) {
    return `¥${(Number(cents || 0) / 100).toFixed(2)}`
  }
})
