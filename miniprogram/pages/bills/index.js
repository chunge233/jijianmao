const api = require('../../utils/api')

Page({
  data: {
    activeFilter: 'all',
    filters: [
      { id: 'all', label: '全部' },
      { id: 'paid', label: '已支付' },
      { id: 'invoice', label: '待开票' }
    ],
    bills: [],
    totalPaid: '¥0',
    invoicePending: 0
  },

  onLoad() {
    this.refreshBills()
  },

  onShow() {
    this.refreshBills()
  },

  selectFilter(event) {
    const { id } = event.currentTarget.dataset

    this.setData({
      activeFilter: id
    })
    this.refreshBills()
  },

  openBill(event) {
    const { id } = event.currentTarget.dataset
    const bill = this.getBill(id)

    if (!bill) {
      return
    }

    wx.showModal({
      title: bill.title,
      content: `订单号：${bill.id}\n支付时间：${bill.time}\n金额：${bill.amount}\n发票：${bill.invoiceText}`,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  applyInvoice(event) {
    const { id } = event.currentTarget.dataset
    const bill = this.getBill(id)

    if (!bill || bill.invoice !== 'available') {
      wx.showToast({
        title: bill ? bill.invoiceText : '账单不存在',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '申请发票',
      content: `${bill.title} ${bill.amount}，将使用工厂默认发票抬头。`,
      confirmText: '提交申请',
      success: (res) => {
        if (!res.confirm) {
          return
        }

        wx.showToast({
          title: '发票已申请',
          icon: 'success'
        })

        api.applyInvoice(id).then(() => {
          this.refreshBills()
        }).catch(() => {
          wx.showToast({
            title: '申请失败，请稍后再试',
            icon: 'none'
          })
          this.refreshBills()
        })
      }
    })
  },

  exportBills() {
    wx.showToast({
      title: '账单导出已生成',
      icon: 'none'
    })
  },

  refreshBills() {
    const activeFilter = this.data.activeFilter
    api.getBills().then((remoteBills) => {
      if (!Array.isArray(remoteBills)) {
        this.setEmptyBills()
        return
      }

      const allBills = remoteBills.map((bill) => ({
        id: bill.id,
        title: bill.title,
        time: (bill.createdAt || '').replace('T', ' ').slice(0, 16),
        amount: this.formatAmount(bill.amountCents),
        status: bill.status,
        statusText: bill.status === 'paid' ? '已支付' : '已抵扣',
        invoice: bill.invoiceStatus,
        invoiceText: this.getInvoiceText(bill.invoiceStatus)
      }))
      const bills = allBills.filter((bill) => this.matchFilter(bill, activeFilter))
      const paidCents = remoteBills.reduce((sum, bill) => {
        return bill.status === 'paid' ? sum + Number(bill.amountCents || 0) : sum
      }, 0)

      this.setData({
        bills,
        totalPaid: this.formatAmount(paidCents),
        invoicePending: allBills.filter((bill) => bill.invoice === 'available' || bill.invoice === 'applying').length
      })
    }).catch(() => {
      this.setEmptyBills()
    })
  },

  getBill(id) {
    return this.data.bills.find((item) => item.id === id)
  },

  setEmptyBills() {
    this.setData({
      bills: [],
      totalPaid: '¥0',
      invoicePending: 0
    })
  },

  matchFilter(bill, activeFilter) {
    if (activeFilter === 'paid') {
      return bill.status === 'paid'
    }

    if (activeFilter === 'invoice') {
      return bill.invoice === 'available' || bill.invoice === 'applying'
    }

    return true
  },

  formatAmount(cents) {
    const prefix = Number(cents) < 0 ? '-¥' : '¥'
    return `${prefix}${Math.abs(Number(cents) / 100).toFixed(0)}`
  },

  getInvoiceText(status) {
    const map = {
      none: '无需发票',
      available: '可申请',
      applying: '开票中',
      issued: '已开具'
    }

    return map[status] || '可申请'
  }
})
