const api = require('../../utils/api')
const { hideTabBar } = require('../../utils/tabbar')

Page({
  data: {
    factoryName: '',
    selectedType: '服装厂',
    types: ['服装厂', '电子厂', '食品厂', '机械厂', '纺织厂', '客户厂', '印刷厂', '塑料厂', '家具厂', '建材厂', '化工厂', '其他']
  },

  onShow() {
    hideTabBar()
  },

  onNameInput(event) {
    this.setData({
      factoryName: event.detail.value || ''
    })
  },

  selectType(event) {
    this.setData({
      selectedType: event.currentTarget.dataset.type
    })
  },

  createFactory() {
    const name = this.data.factoryName.trim() || `${this.data.selectedType}计件工厂`

    wx.showLoading({ title: '创建中' })

    api.createFactory({
      name
    }).then((res) => {
      wx.hideLoading()
      const factory = res.factory || res
      if (res.token) {
        wx.setStorageSync('auth_token', res.token)
      }
      wx.setStorageSync('current_factory', factory)
      wx.showToast({
        title: '工厂已创建',
        icon: 'success'
      })
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/home/index'
        })
      }, 450)
    }).catch((error) => {
      wx.hideLoading()
      wx.showToast({
        title: error.message || '创建失败',
        icon: 'none'
      })
    })
  }
})
