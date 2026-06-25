const api = require('../../utils/api')
const { hideTabBar } = require('../../utils/tabbar')

Page({
  data: {
    factoryName: '',
    factoryLogo: '',
    region: [],
    regionLabels: ['省', '市', '区'],
    hasRegion: false,
    detailAddress: '',
    contactName: '',
    contactPhone: '',
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

  onRegionChange(event) {
    const value = Array.isArray(event.detail.value) ? event.detail.value : []

    this.setData({
      region: value,
      regionLabels: [
        value[0] || '省',
        value[1] || '市',
        value[2] || '区'
      ],
      hasRegion: value.length === 3
    })
  },

  onAddressInput(event) {
    this.setData({
      detailAddress: event.detail.value || ''
    })
  },

  onContactNameInput(event) {
    this.setData({
      contactName: event.detail.value || ''
    })
  },

  onContactPhoneInput(event) {
    this.setData({
      contactPhone: event.detail.value || ''
    })
  },

  selectType(event) {
    this.setData({
      selectedType: event.currentTarget.dataset.type
    })
  },

  chooseLogo() {
    const setLogo = (filePath) => {
      if (!filePath) {
        return
      }

      this.setData({
        factoryLogo: filePath
      })
    }

    if (typeof wx.chooseMedia === 'function') {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed'],
        success: (res) => {
          const file = Array.isArray(res.tempFiles) ? res.tempFiles[0] : null
          setLogo(file && file.tempFilePath)
        },
        fail: (error) => {
          if (this.isCancelChoose(error)) {
            return
          }

          this.chooseLogoLegacy(setLogo)
        }
      })
      return
    }

    this.chooseLogoLegacy(setLogo)
  },

  chooseLogoLegacy(setLogo) {
    if (typeof wx.chooseImage !== 'function') {
      wx.showToast({
        title: '当前环境不支持选择图片',
        icon: 'none'
      })
      return
    }

    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const filePath = Array.isArray(res.tempFilePaths) ? res.tempFilePaths[0] : ''
        setLogo(filePath)
      },
      fail: (error) => {
        if (this.isCancelChoose(error)) {
          return
        }

        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        })
      }
    })
  },

  isCancelChoose(error) {
    return error && error.errMsg && error.errMsg.indexOf('cancel') >= 0
  },

  createFactory() {
    const name = this.data.factoryName.trim() || `${this.data.selectedType}计件工厂`

    wx.showLoading({ title: '创建中' })

    api.createFactory({
      name,
      type: this.data.selectedType,
      region: this.data.region,
      address: this.data.detailAddress.trim(),
      contactName: this.data.contactName.trim(),
      contactPhone: this.data.contactPhone.trim()
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
