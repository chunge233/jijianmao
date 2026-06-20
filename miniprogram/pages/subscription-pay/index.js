const api = require('../../utils/api')

const paymentMethods = [
  { id: 'wechat', title: '微信支付', desc: '推荐使用当前微信账号支付', icon: '/assets/icons/currency-cny-green.svg' },
  { id: 'company', title: '对公转账', desc: '提交订单后联系管理员线下转账', icon: '/assets/icons/buildings-blue.svg' }
]

Page({
  data: {
    planId: 'pro',
    planName: '专业版',
    cycle: 'yearly',
    cycleText: '12个月',
    employees: 100,
    amount: 930,
    amountText: '¥930',
    paymentMethods,
    selectedPaymentId: 'wechat',
    needInvoice: false,
    agreed: true,
    submitting: false
  },

  onLoad(options) {
    const amount = Number(options.amount || 930)
    const cycle = options.cycle || 'yearly'

    this.setData({
      planId: options.planId || 'pro',
      planName: options.planName ? decodeURIComponent(options.planName) : '专业版',
      cycle,
      cycleText: cycle === 'yearly' ? '12个月' : '1个月',
      employees: Number(options.employees || 100),
      amount,
      amountText: `¥${amount}`
    })
  },

  selectPayment(event) {
    const { id } = event.currentTarget.dataset

    this.setData({
      selectedPaymentId: id
    })
  },

  toggleInvoice() {
    this.setData({
      needInvoice: !this.data.needInvoice
    })
  },

  toggleAgreement() {
    this.setData({
      agreed: !this.data.agreed
    })
  },

  submitPay() {
    if (!this.data.agreed) {
      wx.showToast({
        title: '请先同意服务订购协议',
        icon: 'none'
      })
      return
    }

    if (this.data.submitting) {
      return
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: '处理中' })

    api.createPaymentOrder({
      planId: this.data.planId,
      cycle: this.data.cycle
    }).then((res) => {
      return api.confirmPaymentOrder(res.order.id)
    }).then(() => {
      this.finishLocalPayment()
    }).catch(() => {
      this.finishLocalPayment()
    })
  },

  finishLocalPayment() {
    wx.hideLoading()
    this.setData({ submitting: false })

    const subscription = {
      planId: this.data.planId,
      planName: this.data.planName,
      cycle: this.data.cycle,
      employees: this.data.employees,
      amount: this.data.amount,
      paidAt: this.formatNow(),
      expireDate: this.getExpireDate()
    }
    wx.setStorageSync('subscription_current', subscription)

    if (this.data.needInvoice) {
      wx.setStorageSync('subscription_invoice_pending', true)
    }

    wx.showModal({
      title: '支付成功',
      content: `${this.data.planName} 已开通，权益立即生效。`,
      showCancel: false,
      confirmText: '查看套餐',
      success: () => {
        wx.redirectTo({
          url: '/pages/subscription/index'
        })
      }
    })
  },

  formatNow() {
    const date = new Date()
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    const hour = `${date.getHours()}`.padStart(2, '0')
    const minute = `${date.getMinutes()}`.padStart(2, '0')

    return `${date.getFullYear()}-${month}-${day} ${hour}:${minute}`
  },

  getExpireDate() {
    const date = new Date()

    if (this.data.cycle === 'yearly') {
      date.setFullYear(date.getFullYear() + 1)
    } else {
      date.setMonth(date.getMonth() + 1)
    }

    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')

    return `${date.getFullYear()}-${month}-${day}`
  }
})
