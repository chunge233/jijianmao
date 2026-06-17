const { syncTabBar } = require('../../utils/tabbar')

Page({
  data: {
    showGuide: false,
    guideShownOnce: false,
    guideSteps: [
      {
        title: '先看本月工资',
        desc: '这里是当前月份已累计的计件工资，点进去可以核对明细。',
        spotStyle: 'top: 150rpx; left: 28rpx; width: 694rpx; height: 196rpx;'
      },
      {
        title: '再看审核消息',
        desc: '最新报工审核结果会出现在这里，未通过或有异议时先从这里进入处理。',
        spotStyle: 'top: 374rpx; left: 28rpx; width: 694rpx; height: 82rpx;'
      },
      {
        title: '最后核对报工记录',
        desc: '日历和当天记录能帮你确认有没有漏报，点击记录可查看详情。',
        spotStyle: 'top: 484rpx; left: 28rpx; width: 694rpx; height: 300rpx;',
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
    reports: [
      {
        type: '单工序',
        typeClass: 'blue',
        amount: '+¥10.50',
        title: '产品质检',
        meta: '30 件 · 今天 14:30',
        path: '/pages/report-detail-single/index'
      },
      {
        type: '工艺路线',
        typeClass: 'amber',
        amount: '+¥15.00',
        steps: ['切割', '钻孔', '装配'],
        meta: '50 件 · 今天 10:15',
        path: '/pages/report-detail-route/index'
      },
      {
        type: '单工序',
        typeClass: 'blue',
        amount: '+¥8.00',
        title: '包装检验',
        meta: '40 件 · 昨天 16:00',
        path: '/pages/report-detail-single/index'
      }
    ]
  },

  onShow() {
    syncTabBar(0)
    this.showGuideIfNeeded()
  },

  openSalary() {
    wx.navigateTo({
      url: '/pages/salary-detail/index'
    })
  },

  openMessageDetail() {
    wx.navigateTo({
      url: '/pages/message-detail/index'
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
  }
})
