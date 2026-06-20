const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')

const basePage = createPenPage(screens.processDetail)

function cloneScreen() {
  return JSON.parse(JSON.stringify(screens.processDetail))
}

Page({
  ...basePage,

  data: {
    screen: cloneScreen(),
    processId: ''
  },

  onLoad(options) {
    this.setData({
      processId: (options && options.id) || ''
    })
    this.loadProcess()
  },

  handleAction(event) {
    const { action } = event.detail || {}

    if (action === 'disableProcess') {
      this.disableProcess()
      return
    }

    basePage.handleAction.call(this, event)
  },

  loadProcess() {
    if (!this.data.processId) {
      const screen = cloneScreen()
      screen.hero = {
        kicker: '工序详情',
        title: '未找到工序',
        desc: '请从工序管理列表进入详情页。',
        badge: '空'
      }
      screen.sections = [
        {
          id: 'empty',
          type: 'empty',
          title: '缺少工序信息',
          desc: '当前页面没有收到工序ID，无法展示工序详情。'
        }
      ]
      screen.bottomActions = [
        { title: '返回工序管理', path: '/pages/process/index' }
      ]
      this.setData({ screen })
      return
    }

    Promise.all([
      api.getProcess(this.data.processId),
      api.getReports()
    ]).then(([process, reports]) => {
      if (!process) {
        const screen = cloneScreen()
        screen.hero = {
          kicker: '工序详情',
          title: '工序不存在',
          desc: '该工序可能已删除或不属于当前工厂。',
          badge: '空'
        }
        screen.sections = [
          {
            id: 'empty',
            type: 'empty',
            title: '未找到工序',
            desc: '请返回工序管理重新选择。'
          }
        ]
        screen.bottomActions = [
          { title: '返回工序管理', path: '/pages/process/index' }
        ]
        this.setData({ screen })
        return
      }

      const matchedItems = Array.isArray(reports)
        ? reports.flatMap((report) => report.items || []).filter((item) => item.processId === process.id)
        : []
      const quantity = matchedItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
      const totalCents = matchedItems.reduce((sum, item) => sum + Number(item.subtotalCents || 0), 0)
      const screen = cloneScreen()

      screen.hero = {
        kicker: process.qrCode || '工序二维码',
        title: process.name || '工序详情',
        desc: `${this.formatAmount(process.priceCents)}/件 · ${process.status === 'disabled' ? '已停用' : '员工端可报工'}`,
        badge: process.status === 'disabled' ? '停用' : '启用'
      }
      screen.sections = [
        {
          id: 'stats',
          type: 'metrics',
          title: '本月数据',
          items: [
            { label: '报工数量', value: `${quantity}件`, tone: 'blue', short: '件' },
            { label: '产生工资', value: this.formatAmount(totalCents), tone: 'green', short: '¥' }
          ]
        },
        {
          id: 'setting',
          type: 'list',
          title: '工序设置',
          items: [
            { title: '工序二维码', desc: process.qrCode || '未生成', value: '扫码报工' },
            { title: '计件单价', desc: `${this.formatAmount(process.priceCents)}/件`, tag: process.status === 'disabled' ? '停用' : '启用', tagTone: process.status === 'disabled' ? 'gray' : 'green' }
          ]
        }
      ]
      screen.bottomActions = [
        { title: process.status === 'disabled' ? '已停用' : '停用', type: 'secondary', action: 'disableProcess' },
        { title: '编辑', path: `/pages/process-new/index?id=${process.id}` }
      ]

      this.setData({ screen })
    }).catch(() => {})
  },

  disableProcess() {
    if (!this.data.processId) {
      return
    }

    wx.showModal({
      title: '停用工序？',
      content: '停用后员工端将不能继续选择该工序报工。',
      confirmText: '停用',
      success: (res) => {
        if (!res.confirm) {
          return
        }

        api.deleteProcess(this.data.processId).then(() => {
          wx.showToast({ title: '已停用', icon: 'none' })
          this.loadProcess()
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
