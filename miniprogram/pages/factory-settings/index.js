Page({
  data: {
    rows: [
      { title: '工厂信息', desc: '工厂名称、地址、Logo', icon: '/assets/icons/buildings-gray.svg', path: '/pages/admin/factory-info/index' },
      { title: '工价设置', desc: '各工序单价配置', icon: '/assets/icons/currency-cny-gray.svg', path: '/pages/admin/batch-price/index' },
      { title: '工序模板', desc: '预设工序模板管理', icon: '/assets/icons/stack-gray.svg', path: '/pages/process/index' },
      { title: '切换工厂', desc: '多工厂身份与当前工厂', icon: '/assets/icons/buildings-blue.svg', path: '/pages/factory-switch/index' },
      { title: '退出工厂', desc: '退出当前工厂协作', icon: '/assets/icons/x-circle-red.svg', path: '/pages/factory-exit/index' },
      { title: '数据备份', desc: '云端备份与恢复', icon: '/assets/icons/cloud-arrow-up-gray.svg', path: '/pages/admin/backup/index' }
    ]
  },

  openSetting(event) {
    const { path, title } = event.currentTarget.dataset

    if (path) {
      wx.navigateTo({
        url: path
      })
      return
    }

    wx.showToast({
      title,
      icon: 'none'
    })
  }
})
