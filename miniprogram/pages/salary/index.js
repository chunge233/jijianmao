const { syncTabBar } = require('../../utils/tabbar')

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
    stats: [
      { value: '128', label: '报工次数', unit: '次', tone: 'blue' },
      { value: '1,560', label: '总件数', unit: '件', tone: 'green' },
      { value: '¥1.65', label: '平均单价', unit: '/件', tone: 'amber' }
    ],
    history: [
      { month: '2026年5月', status: '已确认', amount: '¥2,340.00', tone: 'green' },
      { month: '2026年4月', status: '有异议', amount: '¥2,150.00', tone: 'red' },
      { month: '2026年3月', status: '已确认', amount: '¥2,760.00', tone: 'green' }
    ]
  },

  onShow() {
    syncTabBar(3)
    this.showGuideIfNeeded()
  },

  openDetail() {
    wx.navigateTo({
      url: '/pages/salary-detail/index'
    })
  },

  openBreakdown() {
    wx.navigateTo({
      url: '/pages/salary-breakdown/index'
    })
  },

  openDispute() {
    wx.navigateTo({
      url: '/pages/dispute/index'
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
  }
})
