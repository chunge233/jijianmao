const api = require('../../utils/api')

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
    routes: []
  },

  onShow() {
    this.loadRoutes()
    this.showGuideIfNeeded()
  },

  onLoad() {
    this.loadRoutes()
  },

  loadRoutes() {
    api.getRoutes().then((routes) => {
      this.setData({
        routes: (Array.isArray(routes) ? routes : []).map((route) => {
          const processes = (route.processes || []).filter(Boolean)

          return {
            id: route.id,
            name: route.name,
            count: `${processes.length}道工序`,
            steps: processes.map((item) => item.name).join(' → ') || route.qrCode
          }
        })
      })
    }).catch(() => {})
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
  },

  goRouteEdit(event) {
    const id = event && event.currentTarget && event.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/route-edit/index${id ? `?id=${id}` : ''}`
    })
  },

  openRouteDetail(event) {
    const { id } = event.currentTarget.dataset

    wx.navigateTo({
      url: `/pages/route-detail/index${id ? `?id=${id}` : ''}`
    })
  },

  openDeleteConfirm(event) {
    const { id } = event.currentTarget.dataset

    wx.showModal({
      title: '停用路线？',
      content: '停用后扫码路线将不再用于新报工。',
      confirmText: '停用',
      success: (res) => {
        if (!res.confirm || !id) {
          return
        }

        api.deleteRoute(id).then(() => {
          wx.showToast({ title: '已停用', icon: 'none' })
          this.loadRoutes()
        }).catch(() => {
          wx.showToast({ title: '停用失败', icon: 'none' })
        })
      }
    })
  }
})
