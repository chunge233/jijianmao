const { syncTabBar } = require('../../utils/tabbar')
const api = require('../../utils/api')
const { ensureFactorySelected } = require('../../utils/session')

Page({
  data: {
    salaryAmount: '¥0.00',
    latestMessageText: '请先创建工序、产品和工艺路线，再开始扫码报工。',
    latestMessageTag: '提醒',
    latestMessageId: '',
    reportSectionTitle: '暂无报工记录',
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
    calendarDays: [],
    reports: []
  },

  onLoad() {
    this.setData({
      calendarDays: this.buildCalendarDays([], new Date())
    })
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

      const sourceReports = Array.isArray(overview.recentReports) ? overview.recentReports : []
      const calendarReports = Array.isArray(overview.reportCalendar) ? overview.reportCalendar : sourceReports
      const reports = sourceReports.length
        ? sourceReports.map((report) => this.normalizeReport(report))
        : []
      const latestMessage = overview.latestMessage || {}
      const calendarAnchor = this.resolveCalendarAnchor(calendarReports)

      this.setData({
        salaryAmount: `¥${(Number(overview.salaryCents || 0) / 100).toFixed(2)}`,
        latestMessageText: latestMessage.content || latestMessage.title || this.data.latestMessageText,
        latestMessageTag: latestMessage.type === 'audit' ? '审核' : (latestMessage.type === 'salary' ? '工资' : '消息'),
        latestMessageId: latestMessage.id || '',
        reportSectionTitle: reports.length ? `最近 ${reports.length} 条报工记录` : '暂无报工记录',
        calendarDays: this.buildCalendarDays(calendarReports, calendarAnchor),
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
      createdAt: report.createdAt || '',
      path: report.type === 'route'
        ? `/pages/report-detail-route/index?id=${report.id}`
        : `/pages/report-detail-single/index?id=${report.id}`
    }
  },

  buildCalendarDays(reports, anchorDate) {
    const anchor = this.parseDate(anchorDate) || new Date()
    const counts = this.countReportsByDate(reports)
    const activeKey = this.dateKey(anchor)
    const start = new Date(anchor)
    const weeks = ['日', '一', '二', '三', '四', '五', '六']

    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - 6)

    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      const key = this.dateKey(date)
      const count = counts[key] || 0

      return {
        week: weeks[date.getDay()],
        day: String(date.getDate()),
        active: key === activeKey,
        dots: count > 0 ? Math.min(count, 2) : 0,
        more: count > 2 ? `+${count - 2}` : ''
      }
    })
  },

  countReportsByDate(reports) {
    return (Array.isArray(reports) ? reports : []).reduce((counts, report) => {
      const date = this.parseDate(report && report.createdAt)
      if (!date) {
        return counts
      }

      const key = this.dateKey(date)
      counts[key] = (counts[key] || 0) + 1
      return counts
    }, {})
  },

  resolveCalendarAnchor(reports) {
    const dates = (Array.isArray(reports) ? reports : [])
      .map((report) => this.parseDate(report && report.createdAt))
      .filter(Boolean)

    if (!dates.length) {
      return new Date()
    }

    return dates.sort((a, b) => b.getTime() - a.getTime())[0]
  },

  parseDate(value) {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value
    }

    if (!value) {
      return null
    }

    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  },

  dateKey(date) {
    const value = this.parseDate(date) || new Date()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')

    return `${value.getFullYear()}-${month}-${day}`
  },

  formatTime(value) {
    if (!value) {
      return ''
    }

    return value.replace('T', ' ').slice(5, 16)
  }
})
