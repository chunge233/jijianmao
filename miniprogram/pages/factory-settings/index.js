Page({
  data: {
    rows: [
      { title: '工厂信息', desc: '工厂名称、地址、Logo', icon: '/assets/icons/buildings-gray.svg' },
      { title: '工价设置', desc: '各工序单价配置', icon: '/assets/icons/currency-cny-gray.svg' },
      { title: '工序模板', desc: '预设工序模板管理', icon: '/assets/icons/stack-gray.svg' },
      { title: '数据备份', desc: '云端备份与恢复', icon: '/assets/icons/cloud-arrow-up-gray.svg' }
    ]
  },

  openSetting(event) {
    const { title } = event.currentTarget.dataset

    wx.showToast({
      title,
      icon: 'none'
    })
  }
})
