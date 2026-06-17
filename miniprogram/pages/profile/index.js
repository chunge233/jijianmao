const { syncTabBar } = require('../../utils/tabbar')

Page({
  data: {
    stats: [
      { icon: '/assets/icons/clipboard-blue.svg', iconTone: 'blue', value: '156', label: '累计报工' },
      { icon: '/assets/icons/package-green.svg', iconTone: 'green', value: '3,820', label: '累计数量' },
      { icon: '/assets/icons/currency-cny-amber.svg', iconTone: 'amber', value: '¥8,650', label: '累计工资' }
    ],
    menus: [
      { icon: '/assets/icons/clipboard-gray.svg', label: '我的报工', path: '/pages/report-records/index' },
      { icon: '/assets/icons/money-gray.svg', label: '我的工资', path: '/pages/salary-detail/index' },
      { icon: '/assets/icons/phone-call-gray.svg', label: '联系我们', path: '/pages/factory-join/index' },
      { icon: '/assets/icons/info-gray.svg', label: '关于计件猫', path: '/pages/settings/index' }
    ]
  },

  onShow() {
    syncTabBar(4)
  },

  openProfileEdit() {
    wx.navigateTo({
      url: '/pages/profile-edit/index'
    })
  },

  openFactorySelect() {
    wx.navigateTo({
      url: '/pages/factory-select/index'
    })
  },

  openMenu(event) {
    const { path } = event.currentTarget.dataset

    if (!path) {
      return
    }

    wx.navigateTo({
      url: path
    })
  }
})
