const api = require('../../utils/api')

Page({
  data: {
    products: [
      { name: '衬衫-A款', code: 'SP-001', category: '上衣类', price: '¥45.00', initial: '衬' },
      { name: '西裤-B款', code: 'SP-002', category: '裤装类', price: '¥68.00', initial: '西' },
      { name: '连衣裙-C款', code: 'SP-003', category: '裙装类', price: '¥88.00', initial: '连' },
      { name: '夹克-D款', code: 'SP-004', category: '外套类', price: '¥120.00', initial: '夹' },
      { name: 'T恤-E款', code: 'SP-005', category: '上衣类', price: '¥35.00', initial: 'T' },
      { name: '短裤-F款', code: 'SP-006', category: '裤装类', price: '¥55.00', initial: '短' }
    ]
  },

  onLoad() {
    this.loadProducts()
  },

  onShow() {
    this.loadProducts()
  },

  loadProducts() {
    api.getProducts().then((products) => {
      if (!Array.isArray(products) || products.length === 0) {
        return
      }

      this.setData({
        products: products.map((item) => ({
          id: item.id,
          name: item.name,
          code: item.code || item.id,
          category: item.status === 'disabled' ? '已停用' : '计件产品',
          price: '按工序计价',
          initial: (item.name || '产').slice(0, 1)
        }))
      })
    }).catch(() => {})
  },

  goNewProduct(event) {
    const id = event && event.currentTarget && event.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product-new/index${id ? `?id=${id}` : ''}`
    })
  },

  openProductDetail(event) {
    const { id } = event.currentTarget.dataset

    wx.navigateTo({
      url: `/pages/product-new/index${id ? `?id=${id}` : ''}`
    })
  },

  openDeleteConfirm(event) {
    const { id } = event.currentTarget.dataset

    wx.showModal({
      title: '停用产品？',
      content: '停用后新建路线和报工将不再优先展示该产品。',
      confirmText: '停用',
      success: (res) => {
        if (!res.confirm || !id) {
          return
        }

        api.deleteProduct(id).then(() => {
          wx.showToast({ title: '已停用', icon: 'none' })
          this.loadProducts()
        }).catch(() => {
          wx.showToast({ title: '停用失败', icon: 'none' })
        })
      }
    })
  }
})
