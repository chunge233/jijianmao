Component({
  data: {
    selected: 0,
    hidden: false,
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: '/assets/tabbar/home.svg',
        selectedIconPath: '/assets/tabbar/home-active.svg'
      },
      {
        pagePath: 'pages/message/index',
        text: '消息',
        iconPath: '/assets/tabbar/message.svg',
        selectedIconPath: '/assets/tabbar/message-active.svg'
      },
      {
        pagePath: 'pages/report/index',
        text: '立即报工',
        iconPath: '/assets/tabbar/report.svg',
        selectedIconPath: '/assets/tabbar/report.svg',
        center: true
      },
      {
        pagePath: 'pages/manage/index',
        text: '管理',
        iconPath: '/assets/tabbar/manage.svg',
        selectedIconPath: '/assets/tabbar/manage-active.svg'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: '/assets/tabbar/profile.svg',
        selectedIconPath: '/assets/tabbar/profile-active.svg'
      }
    ]
  },

  methods: {
    switchTab(event) {
      const { index, path } = event.currentTarget.dataset
      const nextIndex = Number(index)
      const nextItem = this.data.list[nextIndex]

      if (!path) {
        return
      }

      if (nextItem && nextItem.center) {
        wx.navigateTo({
          url: `/${path}`
        })
        return
      }

      if (this.data.selected === nextIndex) {
        return
      }

      wx.switchTab({
        url: `/${path}`
      })
    }
  }
})
