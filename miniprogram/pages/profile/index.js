const { hideTabBar, syncTabBar } = require('../../utils/tabbar')
const api = require('../../utils/api')

function createZeroStats() {
  return [
    { icon: '/assets/icons/clipboard-blue.svg', iconTone: 'blue', value: '0', label: '累计报工' },
    { icon: '/assets/icons/package-green.svg', iconTone: 'green', value: '0', label: '累计数量' },
    { icon: '/assets/icons/currency-cny-amber.svg', iconTone: 'amber', value: '¥0.00', label: '累计工资' }
  ]
}

const guestMenus = [
  { icon: '/assets/icons/phone-blue.svg', label: '登录/注册', path: '/pages/login/index', hideTab: true },
  { icon: '/assets/icons/info-gray.svg', label: '关于计件猫', path: '/pages/about/index' },
  { icon: '/assets/icons/gear-gray.svg', label: '设置', path: '/pages/settings/index' }
]

const noFactoryMenus = [
  { icon: '/assets/icons/buildings-blue.svg', label: '加入/创建工厂', path: '/pages/factory-select/index', hideTab: true },
  { icon: '/assets/icons/gear-gray.svg', label: '设置', path: '/pages/settings/index' }
]

const userMenus = [
  { icon: '/assets/icons/clipboard-gray.svg', label: '我的报工', path: '/pages/report-records/index', requiresFactory: true },
  { icon: '/assets/icons/money-gray.svg', label: '我的工资', path: '/pages/salary-detail/index', requiresFactory: true },
  { icon: '/assets/icons/package-green.svg', label: '套餐订阅', path: '/pages/subscription/index', requiresFactory: true },
  { icon: '/assets/icons/gear-gray.svg', label: '设置', path: '/pages/settings/index' }
]

Page({
  data: {
    isLoggedIn: false,
    hasFactory: false,
    defaultAvatarIcon: '/assets/tabbar/profile.svg',
    userName: '未登录',
    userInitial: '我',
    userRole: '',
    userPhone: '未绑定',
    factoryName: '登录后选择工厂',
    stats: createZeroStats(),
    menus: guestMenus
  },

  onShow() {
    syncTabBar(4)
    this.loadProfile()
  },

  openProfileEdit() {
    if (!this.data.isLoggedIn) {
      hideTabBar()
      wx.navigateTo({
        url: '/pages/login/index'
      })
      return
    }

    wx.navigateTo({
      url: '/pages/profile-edit/index'
    })
  },

  openFactorySelect() {
    if (!this.data.isLoggedIn) {
      hideTabBar()
      wx.navigateTo({
        url: '/pages/login/index'
      })
      return
    }

    if (!this.data.hasFactory) {
      hideTabBar()
      wx.navigateTo({
        url: '/pages/factory-select/index'
      })
      return
    }

    wx.navigateTo({
      url: '/pages/factory-switch/index'
    })
  },

  openMoreStats() {
    if (!this.ensureReadyForFactoryPage()) {
      return
    }

    wx.navigateTo({
      url: '/pages/report-records/index'
    })
  },

  openMenu(event) {
    const { index, path } = event.currentTarget.dataset
    const item = this.data.menus[Number(index)] || {}

    if (!path) {
      return
    }

    if (item.requiresFactory && !this.ensureReadyForFactoryPage()) {
      return
    }

    if (item.hideTab) {
      hideTabBar()
    }

    wx.navigateTo({
      url: path
    })
  },

  logout() {
    wx.showModal({
      title: '退出登录？',
      content: '退出后将返回登录页，云端数据会保留。',
      confirmText: '退出',
      success: (res) => {
        if (!res.confirm) {
          return
        }

        wx.removeStorageSync('auth_token')
        wx.removeStorageSync('current_user')
        wx.removeStorageSync('current_factory')
        hideTabBar()
        wx.redirectTo({
          url: '/pages/login/index'
        })
      }
    })
  },

  loadProfile() {
    if (!wx.getStorageSync('auth_token')) {
      this.setGuestProfile()
      return
    }

    api.getMe().then((me) => {
      const user = (me && me.user) || {}
      const factory = (me && me.factory) || {}
      const hasFactory = !!factory.id
      const roleText = {
        boss: '管理员',
        admin: '组长',
        employee: '员工'
      }[(me && me.role) || 'employee'] || '员工'

      this.setData({
        isLoggedIn: !!user.id,
        hasFactory,
        userName: user.nickname || user.phone || '未命名用户',
        userInitial: (user.nickname || user.phone || '我').slice(0, 1),
        userRole: hasFactory ? roleText : '未加入工厂',
        userPhone: this.maskPhone(user.phone),
        factoryName: factory.name || '加入或创建工厂',
        menus: hasFactory ? userMenus : noFactoryMenus,
        stats: createZeroStats()
      })

      if (!hasFactory) {
        return
      }

      return api.getDashboardOverview().then((overview) => {
        this.setData({
          stats: [
            { icon: '/assets/icons/clipboard-blue.svg', iconTone: 'blue', value: String((overview && overview.reportCount) || 0), label: '累计报工' },
            { icon: '/assets/icons/package-green.svg', iconTone: 'green', value: String((overview && overview.totalQuantity) || 0), label: '累计数量' },
            { icon: '/assets/icons/currency-cny-amber.svg', iconTone: 'amber', value: `¥${(Number((overview && overview.salaryCents) || 0) / 100).toFixed(2)}`, label: '累计工资' }
          ]
        })
      }).catch(() => {})
    }).catch(() => {
      this.setGuestProfile()
    })
  },

  setGuestProfile() {
    this.setData({
      isLoggedIn: false,
      hasFactory: false,
      userName: '未登录',
      userInitial: '我',
      userRole: '',
      userPhone: '未绑定',
      factoryName: '登录后选择工厂',
      stats: createZeroStats(),
      menus: guestMenus
    })
  },

  ensureReadyForFactoryPage() {
    if (!this.data.isLoggedIn) {
      hideTabBar()
      wx.navigateTo({
        url: '/pages/login/index'
      })
      return false
    }

    if (!this.data.hasFactory) {
      hideTabBar()
      wx.navigateTo({
        url: '/pages/factory-select/index'
      })
      return false
    }

    return true
  },

  maskPhone(phone) {
    if (!phone || phone.length < 7) {
      return phone || '未绑定'
    }

    return `${phone.slice(0, 3)}****${phone.slice(-4)}`
  }
})
