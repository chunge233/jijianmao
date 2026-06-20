const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')

const basePage = createPenPage(screens.factorySwitch)

function cloneScreen() {
  return JSON.parse(JSON.stringify(screens.factorySwitch))
}

Page({
  ...basePage,

  data: {
    screen: cloneScreen()
  },

  onLoad() {
    this.loadFactories()
  },

  onShow() {
    this.loadFactories()
  },

  handleAction(event) {
    const { action, id } = event.detail || {}

    if (action === 'switchFactory' && id) {
      this.switchFactory(id)
      return
    }

    basePage.handleAction.call(this, event)
  },

  loadFactories() {
    api.getFactories().then((factories) => {
      if (!Array.isArray(factories) || factories.length === 0) {
        const screen = cloneScreen()
        screen.sections = [
          {
            id: 'empty',
            type: 'empty',
            title: '暂无可切换工厂',
            desc: '你还没有加入其他工厂，可以通过邀请码加入新工厂。'
          },
          {
            id: 'actions',
            type: 'list',
            title: '下一步',
            items: [
              { title: '加入新工厂', desc: '通过邀请码加入', path: '/pages/factory-join/index', short: '+', tone: 'green' }
            ]
          }
        ]
        this.setData({ screen })
        return
      }

      const screen = cloneScreen()
      screen.sections = [
        {
          id: 'factories',
          type: 'list',
          title: '我的工厂',
          items: factories.map((factory) => ({
            id: factory.id,
            title: factory.name,
            desc: `${factory.role === 'boss' ? '管理员' : '员工'} · ${factory.inviteCode}`,
            tag: factory.current ? '当前' : '',
            tagTone: factory.current ? 'blue' : 'gray',
            value: factory.current ? '' : '切换',
            short: '厂',
            tone: 'blue',
            action: factory.current ? '' : 'switchFactory'
          })).concat([
            { title: '加入新工厂', desc: '通过邀请码加入', path: '/pages/factory-join/index', short: '+', tone: 'green' }
          ])
        }
      ]
      this.setData({ screen })
    }).catch(() => {})
  },

  switchFactory(id) {
    api.switchFactory(id).then((res) => {
      if (res && res.token) {
        wx.setStorageSync('auth_token', res.token)
        wx.setStorageSync('current_factory', res.factory)
      }

      wx.showToast({ title: '已切换工厂', icon: 'none' })
      this.loadFactories()
    }).catch(() => {
      wx.showToast({ title: '切换失败', icon: 'none' })
    })
  }
})
