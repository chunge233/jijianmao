Page({
  data: {
    routes: [
      {
        title: '零件加工路线',
        total: '¥62.00',
        steps: [
          { name: '切割', price: '¥0.40', quantity: '40', subtotal: '¥16.00' },
          { name: '钻孔', price: '¥0.50', quantity: '40', subtotal: '¥20.00' },
          { name: '装配', price: '¥0.30', quantity: '40', subtotal: '¥12.00' },
          { name: '质检', price: '¥0.35', quantity: '40', subtotal: '¥14.00', terminal: true }
        ]
      },
      {
        title: '成品组装路线',
        total: '¥33.00',
        steps: [
          { name: '组装', price: '¥0.30', quantity: '30', subtotal: '¥9.00' },
          { name: '调试', price: '¥0.60', quantity: '30', subtotal: '¥18.00' },
          { name: '包装', price: '¥0.20', quantity: '30', subtotal: '¥6.00', terminal: true }
        ]
      }
    ]
  },

  goSuccess() {
    wx.navigateTo({
      url: '/pages/submit-success/index'
    })
  }
})
