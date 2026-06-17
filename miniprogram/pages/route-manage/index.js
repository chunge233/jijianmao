Page({
  data: {
    showGuide: false,
    guideShownOnce: false,
    guideSteps: [
      {
        title: '新增路线前先确认产品',
        desc: '路线按产品建立，点击加号后选择产品，再把工序按生产顺序排好。',
        spotStyle: 'top: 120rpx; left: 28rpx; width: 694rpx; height: 76rpx;'
      },
      {
        title: '路线就是工序流程',
        desc: '每条路线会展示工序顺序和道数，后续报工路线会按这个顺序计件。',
        spotStyle: 'top: 220rpx; left: 28rpx; width: 694rpx; height: 250rpx;'
      },
      {
        title: '编辑时注意工价合计',
        desc: '调整路线工序或排序后，系统要实时更新合计工价，避免报工金额错误。',
        spotStyle: 'top: 220rpx; left: 28rpx; width: 694rpx; height: 250rpx;',
        panelClass: 'panel-top-pos'
      }
    ],
    routes: [
      { name: '衬衫-A款', count: '4道工序', steps: '裁剪 → 缝合 → 质检 → 包装' },
      { name: '西裤-B款', count: '5道工序', steps: '裁剪 → 缝合 → 烫熨 → 质检 → 包装' },
      { name: '连衣裙-C款', count: '4道工序', steps: '裁剪 → 缝合 → 质检 → 包装' },
      { name: '夹克-D款', count: '5道工序', steps: '裁剪 → 缝合 → 烫熨 → 质检 → 包装' },
      { name: 'T恤-E款', count: '3道工序', steps: '裁剪 → 缝合 → 质检' }
    ]
  },

  onShow() {
    this.showGuideIfNeeded()
  },

  showGuideIfNeeded() {
    if (this.data.guideShownOnce || wx.getStorageSync('guide_route_v1')) {
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
