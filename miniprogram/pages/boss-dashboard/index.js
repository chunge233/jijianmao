const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')

const basePage = createPenPage(screens.bossDashboard)

function cloneScreen() {
  return JSON.parse(JSON.stringify(screens.bossDashboard))
}

Page({
  ...basePage,

  data: {
    screen: cloneScreen()
  },

  onLoad() {
    this.loadDashboard()
  },

  onShow() {
    this.loadDashboard()
  },

  loadDashboard() {
    api.getBossDashboard().then((res) => {
      if (!res) {
        return
      }

      const screen = cloneScreen()
      const totalQuantity = Number(res.totalQuantity || 0)
      const ranking = res.processRanking || []

      screen.hero = {
        kicker: '2026年6月',
        title: `¥${(Number(res.totalCents || 0) / 100).toFixed(2)}`,
        desc: '本月计件工资支出',
        badge: `${res.reportCount || 0}单`
      }
      screen.sections = [
        {
          id: 'metrics',
          type: 'metrics',
          title: '核心指标',
          items: [
            { label: '产出件数', value: `${totalQuantity}`, tone: 'blue', short: '件' },
            { label: '报工笔数', value: `${res.reportCount || 0}`, tone: 'purple', short: '单' },
            { label: '在岗人数', value: `${res.employeeCount || 0}`, tone: 'green', short: '人' },
            { label: '待审核', value: `${res.pendingCount || 0}`, tone: 'amber', short: '审' }
          ]
        },
        {
          id: 'ranking',
          type: 'ranking',
          title: '工序产出',
          items: ranking.slice(0, 5).map((item, index) => ({
            rank: index + 1,
            short: item.name.slice(0, 1),
            name: item.name,
            value: `${item.quantity}件`,
            color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#6B7280'][index % 5]
          }))
        }
      ]

      this.setData({ screen })
    }).catch(() => {})
  }
})
