Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    showBack: {
      type: Boolean,
      value: false
    },
    backText: {
      type: String,
      value: '返回'
    },
    backIcon: {
      type: String,
      value: '/assets/icons/caret-left-blue.svg'
    },
    backColor: {
      type: String,
      value: '#1A56DB'
    },
    homeBack: {
      type: Boolean,
      value: false
    },
    rightIcon: {
      type: String,
      value: ''
    }
  },

  data: {
    statusBarHeight: 0,
    navBarHeight: 52,
    contentHeight: 52
  },

  lifetimes: {
    attached() {
      this.setNavigationMetrics()
    }
  },

  methods: {
    handleBack() {
      if (this.properties.homeBack) {
        wx.switchTab({
          url: '/pages/home/index'
        })
        return
      }

      const pages = getCurrentPages()

      if (pages.length > 1) {
        wx.navigateBack()
        return
      }

      wx.switchTab({
        url: '/pages/home/index'
      })
    },

    handleRightTap() {
      this.triggerEvent('righttap')
    },

    setNavigationMetrics() {
      let statusBarHeight = 0
      let navBarHeight = 52
      let contentHeight = 52

      try {
        const windowInfo = typeof wx.getWindowInfo === 'function'
          ? wx.getWindowInfo()
          : wx.getSystemInfoSync()
        const capsule = wx.getMenuButtonBoundingClientRect()

        statusBarHeight = windowInfo.statusBarHeight || 0

        if (capsule && capsule.top && capsule.height) {
          const topGap = capsule.top - statusBarHeight
          contentHeight = topGap * 2 + capsule.height
          navBarHeight = statusBarHeight + contentHeight
        }
      } catch (error) {
        statusBarHeight = 0
        navBarHeight = 52
        contentHeight = 52
      }

      this.setData({
        statusBarHeight,
        navBarHeight,
        contentHeight
      })
    }
  }
})
