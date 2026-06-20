const { syncTabBar } = require('../../utils/tabbar')
const api = require('../../utils/api')
const { ensureFactorySelected } = require('../../utils/session')

Page({
  data: {
    salaryAmount: '¥0.00',
    latestMessageText: '请先创建工序、产品和工艺路线，再开始扫码报工。',
    latestMessageTag: '提醒',
    latestMessageId: '',
    reportSectionTitle: '2026年6月17日 3条报工记录',
    showGuide: false,
    guideShownOnce: false,
    guideSteps: [
      {
        title: '先看本月工资',
        desc: '这里是当前月份已累计的计件工资，点进去可以核对明细。',
        spotStyle: 'top: 150rpx; left: 28rpx; width: 694rpx; height: 198rpx;'
      },
      {
        title: '再看审核消息',
        desc: '最新报工审核结果会出现在这里，未通过或有异议时先从这里进入处理。',
        spotStyle: 'top: 376rpx; left: 28rpx; width: 694rpx; height: 82rpx;'
      },
      {
        title: '最后核对报工记录',
        desc: '日历和当天记录能帮你确认有没有漏报，点击记录可查看详情。',
        spotStyle: 'top: 486rpx; left: 28rpx; width: 694rpx; height: 304rpx;',
        panelClass: 'panel-top-pos'
      }
    ],
    calendarDays: [
      { week: '四', day: '11', dots: 2, more: '+1' },
      { week: '五', day: '12' },
      { week: '六', day: '13' },
      { week: '日', day: '14', dots: 1 },
      { week: '一', day: '15', dots: 2, more: '+3' },
      { week: '二', day: '16' },
      { week: '三', day: '17', active: true, dots: 2, more: '+2' }
    ],
    reports: []
  },

  onShow() {
    ensureFactorySelected().then((ready) => {
      if (!ready) {
        return
      }

      syncTabBar(0)
      this.loadDashboard()
      this.showGuideIfNeeded()
    })
  },

  openSalary() {
    wx.navigateTo({
      url: '/pages/salary-detail/index'
    })
  },

  openMessageDetail() {
    wx.navigateTo({
      url: this.data.latestMessageId ? `/pages/message-detail/index?id=${this.data.latestMessageId}` : '/pages/message/index'
    })
  },

  openRecords() {
    wx.navigateTo({
      url: '/pages/report-records/index'
    })
  },

  openReport(event) {
    const { path } = event.currentTarget.dataset

    if (!path) {
      return
    }

    wx.navigateTo({
      url: path
    })
  },

  showGuideIfNeeded() {
    if (this.data.guideShownOnce || wx.getStorageSync('guide_home_v1')) {
      return
    }

    this.setData({
      showGuide: true,
      guideShownOnce: true
    })
  },

  closeGuide() {
    this.setData({
      showGuide: false
    })
  },

  neverGuide() {
    this.setData({
      showGuide: false,
      guideShownOnce: true
    })
  },

  loadDashboard() {
    api.getDashboardOverview().then((overview) => {
      if (!overview) {
        return
      }

      const reports = Array.isArray(overview.recentReports)
        ? overview.recentReports.map((report) => this.normalizeReport(report))
        : []
      const latestMessage = overview.latestMessage || {}

      this.setData({
        salaryAmount: `¥${(Number(overview.salaryCents || 0) / 100).toFixed(2)}`,
        latestMessageText: latestMessage.content || latestMessage.title || this.data.latestMessageText,
        latestMessageTag: latestMessage.type === 'audit' ? '审核' : (latestMessage.type === 'salary' ? '工资' : '消息'),
        latestMessageId: latestMessage.id || '',
        reportSectionTitle: `${this.formatMonthDay(new Date())} ${reports.length}条报工记录`,
        reports
      })
    }).catch(() => {})
  },

  normalizeReport(report) {
    const type = report.type === 'route' ? '工艺路线' : '单工序'
    const items = report.items || []
    const firstItem = items[0] || {}

    return {
      id: report.id,
      type,
      typeClass: report.type === 'route' ? 'amber' : 'blue',
      amount: `+¥${(Number(report.totalCents || 0) / 100).toFixed(2)}`,
      title: report.type === 'route' ? '' : (firstItem.processName || '报工记录'),
      steps: report.type === 'route' ? items.map((item) => item.processName || '工序') : [],
      meta: `${report.quantity || 0} 件 · ${this.formatTime(report.createdAt)}`,
      path: report.type === 'route'
        ? `/pages/report-detail-route/index?id=${report.id}`
        : `/pages/report-detail-single/index?id=${report.id}`
    }
  },

  formatTime(value) {
    if (!value) {
      return ''
    }

    return value.replace('T', ' ').slice(5, 16)
  },

  formatMonthDay(date) {
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${date.getFullYear()}年${month}月${day}日`
  }
})
