const api = require('../../utils/api')

Page({
  data: {
    metrics: [
      { label: '本月产出', value: '0件', icon: '/assets/icons/package-green.svg', tone: 'blue' },
      { label: '本月工资', value: '¥0.00', icon: '/assets/icons/currency-cny-green.svg', tone: 'green' },
      { label: '在岗人数', value: '0人', icon: '/assets/icons/users-three-blue.svg', tone: 'amber' },
      { label: '待审核', value: '0条', icon: '/assets/icons/tree-structure-purple.svg', tone: 'purple' }
    ],
    ranks: [],
    bars: []
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

      const processRanking = res.processRanking || []
      const totalQuantity = Number(res.totalQuantity || 0)
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#6B7280']

      this.setData({
        metrics: [
          { label: '本月产出', value: `${totalQuantity}件`, icon: '/assets/icons/package-green.svg', tone: 'blue' },
          { label: '本月工资', value: `¥${(Number(res.totalCents || 0) / 100).toFixed(2)}`, icon: '/assets/icons/currency-cny-green.svg', tone: 'green' },
          { label: '在岗人数', value: `${res.employeeCount || 0}人`, icon: '/assets/icons/users-three-blue.svg', tone: 'amber' },
          { label: '待审核', value: `${res.pendingCount || 0}条`, icon: '/assets/icons/tree-structure-purple.svg', tone: 'purple' }
        ],
        ranks: processRanking.slice(0, 5).map((item, index) => ({
          rank: index < 3 ? String(index + 1) : `#${index + 1}`,
          name: item.name,
          initial: item.name.slice(0, 1),
          quantity: `${item.quantity}件`,
          color: colors[index % colors.length]
        })),
        bars: processRanking.slice(0, 5).map((item, index) => {
          const percent = totalQuantity ? Math.round((Number(item.quantity || 0) / totalQuantity) * 100) : 0
          return {
            label: item.name,
            value: `${percent}%`,
            width: `${percent}%`,
            color: colors[index % colors.length]
          }
        })
      })
    }).catch(() => {})
  }
})
