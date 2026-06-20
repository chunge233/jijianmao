Page({
  data: {
    rows: [
      { title: '工厂信息', desc: '工厂名称、地址、Logo', icon: '/assets/icons/buildings-gray.svg', path: '/pages/admin/factory-info/index' },
      { title: '套餐订阅', desc: '套餐升级、员工额度和试用状态', icon: '/assets/icons/package-green.svg', path: '/pages/subscription/index' },
      { title: '账单发票', desc: '支付记录、发票申请和账单导出', icon: '/assets/icons/file-text-blue.svg', path: '/pages/bills/index' }
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
