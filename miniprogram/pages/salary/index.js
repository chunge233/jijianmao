const { syncTabBar } = require('../../utils/tabbar')
const api = require('../../utils/api')

Page({
  data: {
    showGuide: false,
    guideShownOnce: false,
    guideSteps: [
      {
        title: '先切换月份核对',
        desc: '左右切换月份，查看每个月的计件工资和确认状态。',
        spotStyle: 'top: 140rpx; left: 21rpx; width: 708rpx; height: 58rpx;'
      },
      {
        title: '点击工资卡看详情',
        desc: '这里能进入工资明细，按工序核对数量、单价和合计金额。',
        spotStyle: 'top: 216rpx; left: 21rpx; width: 708rpx; height: 200rpx;'
      },
      {
        title: '确认或提出异议',
        desc: '确认前先核对明细；有问题可以关联多条报工后提交异议。',
        spotStyle: 'top: 600rpx; left: 21rpx; width: 708rpx; height: 262rpx;',
        panelClass: 'panel-top-pos'
      }
    ],
    hasSalary: false,
    currentMonth: '2026年6月',
    currentMonthValue: '2026-06',
    currentAmount: '¥0.00',
    confirmStatus: '暂无工资 · 等待报工通过后生成',
    confirmTone: 'gray',
    stats: [
      { value: '0', label: '报工次数', unit: '次', tone: 'blue' },
      { value: '0', label: '总件数', unit: '件', tone: 'green' },
      { value: '¥0.00', label: '平均单价', unit: '/件', tone: 'amber' }
    ],
    history: []
  },

  onShow() {
    syncTabBar(3)
    this.loadSalaryMonths()
    this.showGuideIfNeeded()
  },

  openDetail() {
    wx.navigateTo({
      url: `/pages/salary-detail/index?month=${encodeURIComponent(this.data.currentMonthValue)}`
    })
  },

  openBreakdown() {
    wx.navigateTo({
      url: `/pages/salary-breakdown/index?month=${encodeURIComponent(this.data.currentMonthValue)}`
    })
  },

  confirmSalary() {
    if (!this.data.hasSalary) {
      wx.showToast({ title: '暂无可确认工资', icon: 'none' })
      return
    }

    api.confirmSalary(this.data.currentMonthValue).then(() => {
      wx.navigateTo({
        url: '/pages/salary-confirm-success/index'
      })
    }).catch(() => {
      wx.showToast({ title: '确认失败', icon: 'none' })
    })
  },

  openDispute() {
    if (!this.data.hasSalary) {
      wx.showToast({ title: '暂无可异议工资', icon: 'none' })
      return
    }

    wx.navigateTo({
      url: `/pages/dispute/index?month=${encodeURIComponent(this.data.currentMonthValue)}`
    })
  },

  showGuideIfNeeded() {
    if (this.data.guideShownOnce || wx.getStorageSync('guide_salary_v1')) {
      return
    }

    this.setData({
      showGuide: true,
      guideShownOnce: true
    })
  },

  closeGuide() {
    this.setData({
      showGuide: false
    })
  },

  neverGuide() {
    this.setData({
      showGuide: false,
      guideShownOnce: true
    })
  },

  loadSalaryMonths() {
    api.getSalaryMonths().then((months) => {
      if (!Array.isArray(months) || months.length === 0) {
        this.showEmptySalary()
        return
      }

      const current = months[0]
      const reportCount = Number(current.reportCount || 0)
      const totalCents = Number(current.totalCents || 0)
      const quantity = Number(current.quantity || 0)

      this.setData({
        hasSalary: reportCount > 0 || totalCents > 0 || quantity > 0,
        currentMonth: this.formatMonth(current.month),
        currentMonthValue: current.month || '2026-06',
        currentAmount: `¥${(totalCents / 100).toFixed(2)}`,
        confirmStatus: reportCount || totalCents || quantity
          ? (current.status === 'confirmed' ? '已确认' : '待确认 · 请核对工资后确认')
          : '暂无工资 · 等待报工通过后生成',
        confirmTone: reportCount || totalCents || quantity
          ? (current.status === 'confirmed' ? 'green' : 'amber')
          : 'gray',
        stats: [
          { value: `${reportCount}`, label: '报工次数', unit: '次', tone: 'blue' },
          { value: `${quantity}`, label: '总件数', unit: '件', tone: 'green' },
          { value: quantity ? `¥${(totalCents / quantity / 100).toFixed(2)}` : '¥0.00', label: '平均单价', unit: '/件', tone: 'amber' }
        ],
        history: months.slice(1).map((item) => ({
          month: this.formatMonth(item.month),
          status: item.status === 'confirmed' ? '已确认' : '待确认',
          amount: `¥${(Number(item.totalCents || 0) / 100).toFixed(2)}`,
          tone: item.status === 'confirmed' ? 'green' : 'amber'
        }))
      })
    }).catch(() => {
      this.showEmptySalary()
    })
  },

  showEmptySalary() {
    this.setData({
      hasSalary: false,
      currentAmount: '¥0.00',
      confirmStatus: '暂无工资 · 等待报工通过后生成',
      confirmTone: 'gray',
      stats: [
        { value: '0', label: '报工次数', unit: '次', tone: 'blue' },
        { value: '0', label: '总件数', unit: '件', tone: 'green' },
        { value: '¥0.00', label: '平均单价', unit: '/件', tone: 'amber' }
      ],
      history: []
    })
  },

  formatMonth(month) {
    const parts = String(month || '2026-06').split('-')
    return `${parts[0]}年${Number(parts[1] || 1)}月`
  }
})
