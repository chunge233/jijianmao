const { syncTabBar } = require('../../utils/tabbar')

Page({
  data: {
    showGuide: false,
    guideShownOnce: false,
    guideSteps: [
      {
        title: '先完成基础配置',
        desc: '工厂信息、权限、员工和加入申请决定谁能进入工厂、能做什么。',
        spotStyle: 'top: 160rpx; left: 28rpx; width: 694rpx; height: 220rpx;'
      },
      {
        title: '再配置计件资料',
        desc: '工序、产品、路线和批量调价会影响报工金额，建议先配置再开放报工。',
        spotStyle: 'top: 410rpx; left: 28rpx; width: 694rpx; height: 220rpx;',
        panelClass: 'panel-top-pos'
      },
      {
        title: '最后处理日常业务',
        desc: '报工审核、异议处理、工资确认和导出记录是管理员每天重点关注的区域。',
        spotStyle: 'top: 660rpx; left: 28rpx; width: 694rpx; height: 430rpx;',
        panelClass: 'panel-top-pos'
      }
    ],
    sections: [
      {
        title: '基础配置',
        items: [
          { label: '工厂信息', icon: '/assets/icons/buildings-blue.svg', path: '/pages/admin/factory-info/index' },
          { label: '权限管理', icon: '/assets/icons/shield-check-cyan.svg', path: '/pages/permission/index' },
          { label: '员工管理', icon: '/assets/icons/users-three-green.svg', path: '/pages/employee/index' },
          { label: '加入申请', icon: '/assets/icons/users-three-blue.svg', path: '/pages/admin/join-apply/index' }
        ]
      },
      {
        title: '计件配置',
        items: [
          { label: '工序管理', icon: '/assets/icons/tree-structure-purple.svg', path: '/pages/process/index' },
          { label: '产品管理', icon: '/assets/icons/package-pink.svg', path: '/pages/product/index' },
          { label: '工艺路线', icon: '/assets/icons/git-branch-indigo.svg', path: '/pages/route-manage/index' },
          { label: '批量调价', icon: '/assets/icons/currency-cny-amber.svg', path: '/pages/admin/batch-price/index' }
        ]
      },
      {
        title: '业务处理',
        items: [
          { label: '报工审核', icon: '/assets/icons/clipboard-text-blue.svg', path: '/pages/audit/index' },
          { label: '报工管理', icon: '/assets/icons/clipboard-text-green.svg', path: '/pages/report-manage/index' },
          { label: '异议处理', icon: '/assets/icons/clock-amber.svg', path: '/pages/dispute-list/index' },
          { label: '公告管理', icon: '/assets/icons/megaphone-red.svg', path: '/pages/announcement/index' }
        ]
      },
      {
        title: '数据财务',
        items: [
          { label: '数据看板', icon: '/assets/icons/chart-bar-amber.svg', path: '/pages/dashboard/index' },
          { label: '工资报表', icon: '/assets/icons/currency-cny-green.svg', path: '/pages/salary-report/index' },
          { label: '工资确认', icon: '/assets/icons/check-green.svg', path: '/pages/admin/salary-confirm/index' },
          { label: '导出记录', icon: '/assets/icons/export-blue.svg', path: '/pages/admin/export-records/index' }
        ]
      },
      {
        title: '系统与安全',
        items: [
          { label: '操作日志', icon: '/assets/icons/file-text-blue.svg', path: '/pages/admin/audit-log/index' },
          { label: '数据备份', icon: '/assets/icons/cloud-arrow-up-gray.svg', path: '/pages/admin/backup/index' },
          { label: '通知设置', icon: '/assets/icons/bell-gray.svg', path: '/pages/admin/notification/index' },
          { label: '工厂设置', icon: '/assets/icons/gear-gray.svg', path: '/pages/factory-settings/index' }
        ]
      }
    ]
  },

  onShow() {
    syncTabBar(3)
    this.showGuideIfNeeded()
  },

  openItem(event) {
    const { path } = event.currentTarget.dataset

    if (!path) {
      return
    }

    wx.navigateTo({
      url: path
    })
  },

  showGuideIfNeeded() {
    if (this.data.guideShownOnce || wx.getStorageSync('guide_manage_v1')) {
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
