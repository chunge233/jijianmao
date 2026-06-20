const { syncTabBar } = require('../../utils/tabbar')
const { ensureFactorySelected } = require('../../utils/session')

Page({
  data: {
    showGuide: false,
    guideShownOnce: false,
    guideSteps: [
      {
        title: '先配置人员和计件资料',
        desc: '员工、权限、工序、产品和工艺路线是报工与工资计算的基础。',
        spotStyle: 'top: 160rpx; left: 28rpx; width: 694rpx; height: 300rpx;'
      },
      {
        title: '日常只处理报工和工资',
        desc: '第一版主线是报工审核、记录管理、工资核算与确认。',
        spotStyle: 'top: 490rpx; left: 28rpx; width: 694rpx; height: 300rpx;',
        panelClass: 'panel-top-pos'
      },
      {
        title: '收费入口直接可见',
        desc: '套餐订阅和账单发票直接放在管理页，减少第一版路径复杂度。',
        spotStyle: 'top: 820rpx; left: 28rpx; width: 694rpx; height: 220rpx;',
        panelClass: 'panel-top-pos'
      }
    ],
    sections: [
      {
        title: '人员与权限',
        items: [
          { label: '员工管理', icon: '/assets/icons/users-three-green.svg', path: '/pages/employee/index' },
          { label: '权限管理', icon: '/assets/icons/shield-check-cyan.svg', path: '/pages/permission/index' }
        ]
      },
      {
        title: '计件资料',
        items: [
          { label: '工序管理', icon: '/assets/icons/tree-structure-purple.svg', path: '/pages/process/index' },
          { label: '产品管理', icon: '/assets/icons/package-pink.svg', path: '/pages/product/index' },
          { label: '工艺路线', icon: '/assets/icons/git-branch-indigo.svg', path: '/pages/route-manage/index' }
        ]
      },
      {
        title: '报工与工资',
        items: [
          { label: '报工审核', icon: '/assets/icons/clipboard-text-blue.svg', path: '/pages/audit/index' },
          { label: '报工管理', icon: '/assets/icons/clipboard-text-green.svg', path: '/pages/report-manage/index' },
          { label: '工资报表', icon: '/assets/icons/currency-cny-green.svg', path: '/pages/salary-report/index' },
          { label: '工资确认', icon: '/assets/icons/check-green.svg', path: '/pages/admin/salary-confirm/index' }
        ]
      },
      {
        title: '收费与设置',
        items: [
          { label: '套餐订阅', icon: '/assets/icons/package-green.svg', path: '/pages/subscription/index' },
          { label: '账单发票', icon: '/assets/icons/file-text-blue.svg', path: '/pages/bills/index' },
          { label: '工厂设置', icon: '/assets/icons/gear-gray.svg', path: '/pages/factory-settings/index' }
        ]
      }
    ]
  },

  onShow() {
    ensureFactorySelected().then((ready) => {
      if (!ready) {
        return
      }

      syncTabBar(3)
      this.showGuideIfNeeded()
    })
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
