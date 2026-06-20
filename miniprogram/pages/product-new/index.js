const api = require('../../utils/api')

Page({
  data: {
    productId: '',
    name: '',
    code: '',
    saving: false
  },

  onLoad(options) {
    const productId = (options && options.id) || ''
    this.setData({ productId })

    if (productId) {
      this.loadProduct(productId)
    }
  },

  loadProduct(productId) {
    api.getProduct(productId).then((product) => {
      if (!product) {
        return
      }

      this.setData({
        name: product.name || '',
        code: product.code || ''
      })
    }).catch(() => {})
  },

  onNameInput(event) {
    this.setData({ name: event.detail.value || '' })
  },

  onCodeInput(event) {
    this.setData({ code: event.detail.value || '' })
  },

  saveProduct() {
    const name = this.data.name.trim()
    const code = this.data.code.trim() || `P-${Date.now()}`

    if (!name) {
      wx.showToast({ title: '请输入产品名称', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    const payload = { name, code }
    const request = this.data.productId
      ? api.updateProduct(this.data.productId, payload)
      : api.createProduct(payload)

    request.then(() => {
      this.setData({ saving: false })
      wx.showToast({ title: '产品已保存', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 450)
    }).catch((error) => {
      this.setData({ saving: false })
      wx.showToast({ title: error.message || '保存失败', icon: 'none' })
    })
  }
})
