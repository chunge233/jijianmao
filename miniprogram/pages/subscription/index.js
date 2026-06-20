const api = require('../../utils/api')

const fallbackPlans = [
  {
    id: 'basic',
    name: '基础版',
    badge: '轻量使用',
    desc: '适合 20 人以内小团队',
    monthly: 99,
    yearly: 990,
    employees: 20,
    features: ['单工序报工', '基础工资统计', '消息通知']
  },
  {
    id: 'pro',
    name: '专业版',
    badge: '推荐',
    desc: '覆盖报工、审核、工资核算主流程',
    monthly: 129,
    yearly: 1290,
    yearlyDeal: 930,
    employees: 100,
    features: ['扫码报工', '工艺路线', '工资确认', '权限角色']
  },
  {
    id: 'ultimate',
    name: '旗舰版',
    badge: '多工厂',
    desc: '适合多工厂和高级数据权限',
    monthly: 299,
    yearly: 2990,
    employees: 300,
    features: ['多工厂管理', '数据导出', '高级权限', '专属支持'],
    contact: true
  }
]

const planMeta = {
  basic: {
    badge: '轻量使用',
    desc: '适合 20 人以内小团队',
    yearlyOrigin: 990
  },
  pro: {
    badge: '推荐',
    desc: '覆盖报工、审核、工资核算主流程',
    yearlyOrigin: 1290
  },
  ultimate: {
    badge: '多工厂',
    desc: '适合多工厂和高级数据权限'
  }
}

const seatOptions = [
  { id: '20', label: '20人', employees: 20, extra: 0 },
  { id: '100', label: '100人', employees: 100, extra: 0 },
  { id: '300', label: '300人', employees: 300, extra: 180 }
]

Page({
  data: {
    cycle: 'yearly',
    selectedPlanId: 'pro',
    selectedSeatId: '100',
    plansConfig: fallbackPlans,
    plans: [],
    seats: seatOptions,
    currentPlan: {
      name: '专业版试用',
      status: '试用中',
      daysLeft: 12,
      expireDate: '2026-06-30',
      employees: 100
    },
    orderAmount: '¥930',
    savingText: '年付已优惠 ¥360'
  },

  onLoad() {
    this.loadCurrentSubscription()
    this.loadPlans()
  },

  onShow() {
    this.loadCurrentSubscription()
    this.loadPlans()
  },

  switchCycle(event) {
    const { cycle } = event.currentTarget.dataset

    this.setData({ cycle })
    this.refreshPlans()
  },

  selectPlan(event) {
    const { id } = event.currentTarget.dataset
    const plan = this.getPlanConfig().find((item) => item.id === id)

    if (!plan) {
      return
    }

    if (plan.contact) {
      wx.showModal({
        title: '联系销售',
        content: '旗舰版需要按工厂规模报价，是否复制联系电话？',
        confirmText: '复制电话',
        success: (res) => {
          if (res.confirm) {
            wx.setClipboardData({
              data: '400-800-2026'
            })
          }
        }
      })
      return
    }

    const seat = seatOptions.find((item) => item.employees >= plan.employees) || seatOptions[0]

    this.setData({
      selectedPlanId: id,
      selectedSeatId: seat.id
    })
    this.refreshPlans()
  },

  selectSeat(event) {
    const { id } = event.currentTarget.dataset

    this.setData({
      selectedSeatId: id
    })
    this.refreshPlans()
  },

  openBills() {
    wx.navigateTo({
      url: '/pages/bills/index'
    })
  },

  openPay() {
    const plan = this.getSelectedPlan()

    if (!plan) {
      return
    }

    const seat = this.getSelectedSeat()
    const amount = this.getAmount(plan, seat)
    const params = [
      `planId=${plan.id}`,
      `planName=${encodeURIComponent(plan.name)}`,
      `cycle=${this.data.cycle}`,
      `employees=${seat.employees}`,
      `amount=${amount}`
    ].join('&')

    wx.navigateTo({
      url: `/pages/subscription-pay/index?${params}`
    })
  },

  loadPlans() {
    api.getPlans().then((plans) => {
      const plansConfig = Array.isArray(plans) && plans.length
        ? plans.map((plan, index) => this.normalizePlan(plan, index))
        : fallbackPlans

      this.setData({ plansConfig })
      this.ensureSelectedPlan()
      this.refreshPlans()
    }).catch(() => {
      this.setData({ plansConfig: fallbackPlans })
      this.ensureSelectedPlan()
      this.refreshPlans()
    })
  },

  normalizePlan(plan, index) {
    const meta = planMeta[plan.id] || {}
    const employeeLimit = Number(plan.employeeLimit || plan.employees || 0)
    const monthly = Math.round(Number(plan.monthlyCents || plan.monthly * 100 || 0) / 100)
    const yearly = Math.round(Number(plan.yearlyCents || plan.yearly * 100 || 0) / 100)

    return {
      id: plan.id,
      name: plan.name,
      badge: meta.badge || (index === 0 ? '轻量使用' : '推荐'),
      desc: meta.desc || `适合 ${employeeLimit} 人以内团队`,
      monthly,
      yearly,
      yearlyOrigin: meta.yearlyOrigin || yearly,
      employees: employeeLimit,
      features: Array.isArray(plan.features) && plan.features.length ? plan.features : ['报工管理', '工资统计'],
      contact: !!plan.contact
    }
  },

  ensureSelectedPlan() {
    const selected = this.getPlanConfig().find((item) => item.id === this.data.selectedPlanId)

    if (!selected && this.data.plansConfig.length) {
      const nextPlan = this.data.plansConfig[0]
      const nextSeat = seatOptions.find((item) => item.employees >= nextPlan.employees) || seatOptions[0]
      this.setData({
        selectedPlanId: nextPlan.id,
        selectedSeatId: nextSeat.id
      })
    }
  },

  refreshPlans() {
    const selectedPlanId = this.data.selectedPlanId
    const selectedSeat = this.getSelectedSeat()
    const plans = this.getPlanConfig().map((plan) => {
      const amount = this.getAmount(plan, selectedSeat)
      const origin = this.data.cycle === 'yearly' ? (plan.yearlyOrigin || plan.yearly) : plan.monthly

      return {
        ...plan,
        selected: plan.id === selectedPlanId,
        price: plan.contact ? '联系销售' : `¥${amount}`,
        originPrice: !plan.contact && origin > amount ? `¥${origin}` : '',
        unit: this.data.cycle === 'yearly' ? '/年' : '/月'
      }
    })
    const selectedPlan = this.getSelectedPlan()
    const amount = selectedPlan ? this.getAmount(selectedPlan, selectedSeat) : 0
    const saving = selectedPlan && this.data.cycle === 'yearly'
      ? (selectedPlan.yearlyOrigin || selectedPlan.yearly) - amount
      : 0

    this.setData({
      plans,
      orderAmount: `¥${amount}`,
      savingText: saving > 0 ? `年付已优惠 ¥${saving}` : '可随时升级套餐'
    })
  },

  getPlanConfig() {
    return this.data.plansConfig.length ? this.data.plansConfig : fallbackPlans
  },

  getSelectedPlan() {
    return this.getPlanConfig().find((item) => item.id === this.data.selectedPlanId)
  },

  getSelectedSeat() {
    return seatOptions.find((item) => item.id === this.data.selectedSeatId) || seatOptions[0]
  },

  getAmount(plan, seat) {
    const base = this.data.cycle === 'yearly'
      ? (plan.yearlyDeal || plan.yearly)
      : plan.monthly

    return base + (seat.extra || 0)
  },

  loadCurrentSubscription() {
    const current = wx.getStorageSync('subscription_current')

    if (current && current.planName) {
      this.applyCurrentSubscription(current)
    }

    api.getCurrentSubscription().then((subscription) => {
      if (!subscription) {
        return
      }

      this.applyCurrentSubscription({
        planId: subscription.planId,
        planName: subscription.planName,
        cycle: 'yearly',
        employees: subscription.employeeLimit,
        expireDate: (subscription.expireAt || '').slice(0, 10)
      })
    }).catch(() => {})
  },

  applyCurrentSubscription(current) {
    this.setData({
      currentPlan: {
        name: current.planName,
        status: current.planName.includes('试用') ? '试用中' : '已开通',
        daysLeft: this.getDaysLeft(current.expireDate),
        expireDate: current.expireDate,
        employees: current.employees
      }
    })
  },

  getDaysLeft(expireDate) {
    if (!expireDate) {
      return 0
    }

    const today = new Date()
    const expire = new Date(`${expireDate}T00:00:00`)
    const diff = expire.getTime() - today.getTime()

    return Math.max(0, Math.ceil(diff / 86400000))
  }
})
