const api = require('../../utils/api')

function parsePrice(value) {
  const cleaned = String(value || '')
    .replace(/[^\d.]/g, '')
    .replace(/(\..*)\./g, '$1')
  const price = Number(cleaned)
  return Number.isFinite(price) ? price : NaN
}

Page({
  data: {
    processId: '',
    name: '',
    price: '0.50',
    qrCode: '',
    saving: false
  },

  onLoad(options) {
    const processId = (options && options.id) || ''
    this.setData({ processId })

    if (processId) {
      this.loadProcess(processId)
    }
  },

  loadProcess(processId) {
    api.getProcess(processId).then((process) => {
      if (!process) {
        return
      }

      this.setData({
        name: process.name || '',
        price: String((Number(process.priceCents || 0) / 100).toFixed(2)),
        qrCode: process.qrCode || ''
      })
    }).catch(() => {})
  },

  onNameInput(event) {
    this.setData({ name: event.detail.value || '' })
  },

  onPriceInput(event) {
    this.setData({ price: event.detail.value || '' })
  },

  saveProcess() {
    const name = this.data.name.trim()
    const price = parsePrice(this.data.price)

    if (!name) {
      wx.showToast({ title: '请输入工序名称', icon: 'none' })
      return
    }

    if (!Number.isFinite(price) || price <= 0) {
      wx.showToast({ title: '请输入正确单价', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    const payload = {
      name,
      priceCents: Math.round(price * 100)
    }
    const request = this.data.processId
      ? api.updateProcess(this.data.processId, payload)
      : api.createProcess(payload)

    request.then(() => {
      this.setData({ saving: false })
      wx.showToast({ title: '工序已保存', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 450)
    }).catch((error) => {
      this.setData({ saving: false })
      wx.showToast({ title: error.message || '保存失败', icon: 'none' })
    })
  }
})
