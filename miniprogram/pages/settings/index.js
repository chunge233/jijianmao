Page({
  data: {
    firstRows: [
      { icon: '/assets/icons/shield-check-gray.svg', title: '账号安全', desc: '修改密码、绑定手机', path: '/pages/account-security/index' },
      { icon: '/assets/icons/bell-gray.svg', title: '消息通知', desc: '推送、提醒、工资变动', path: '/pages/notification-preference/index' }
    ],
    secondRows: [
      { icon: '/assets/icons/trash-simple-gray.svg', title: '清除缓存', desc: '清除本地临时数据', value: '12.5MB', path: '/pages/clear-cache/index' },
      { icon: '/assets/icons/info-gray.svg', title: '关于我们', desc: '版本号 1.0.0', path: '/pages/about/index' }
    ]
  },

  openRow(event) {
    const { path } = event.currentTarget.dataset

    if (!path) {
      return
    }

    wx.navigateTo({
      url: path
    })
  }
})
