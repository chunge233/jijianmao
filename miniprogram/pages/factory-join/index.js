const api = require('../../utils/api')
const { hideTabBar } = require('../../utils/tabbar')

Page({
  data: {
    inviteCode: '',
    factory: null,
    factoryInitial: '厂',
    stats: [],
    avatars: [],
    loading: true,
    canJoin: false,
    joinHint: '确认工厂信息后加入',
    joinButtonText: '立即加入'
  },

  onShow() {
    hideTabBar()
  },

  onLoad(options) {
    const inviteCode = getInviteCodeFromOptions(options)
    this.setData({ inviteCode })

    if (!inviteCode) {
      this.setData({
        loading: false,
        canJoin: false,
        joinHint: '暂无可加入的工厂',
        joinButtonText: '返回'
      })
      return
    }

    this.loadInvite(inviteCode)
  },

  loadInvite(inviteCode) {
    this.setData({ loading: true })

    api.getFactoryInvite(inviteCode).then((res) => {
      const factory = (res && res.factory) || res

      if (!factory || !factory.name) {
        throw new Error('INVALID_INVITE')
      }

      this.setData({
        factory,
        factoryInitial: getFactoryInitial(factory.name),
        stats: buildFactoryStats(factory),
        avatars: buildAvatars(factory.name),
        loading: false,
        canJoin: true,
        joinHint: '确认后进入工厂工作台',
        joinButtonText: '立即加入'
      })
    }).catch(() => {
      this.setData({
        factory: null,
        stats: [],
        avatars: [],
        loading: false,
        canJoin: false,
        joinHint: '暂无可加入的工厂',
        joinButtonText: '返回'
      })
    })
  },

  joinFactory() {
    const inviteCode = this.data.inviteCode.trim()

    if (!inviteCode || !this.data.canJoin) {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        wx.navigateBack()
      } else {
        wx.redirectTo({ url: '/pages/factory-select/index' })
      }
      return
    }

    wx.showLoading({ title: '加入中' })

    api.joinFactory(inviteCode).then((res) => {
      wx.hideLoading()

      if (res && res.ok === false) {
        wx.showToast({ title: res.message || '加入失败', icon: 'none' })
        return
      }

      if (res && res.token) {
        wx.setStorageSync('auth_token', res.token)
      }

      if (res && res.factory) {
        wx.setStorageSync('current_factory', res.factory)
      }

      wx.showToast({
        title: '已加入工厂',
        icon: 'none'
      })
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/home/index'
        })
      }, 450)
    }).catch((error) => {
      wx.hideLoading()
      wx.showToast({
        title: error.message || '加入失败',
        icon: 'none'
      })
    })
  }
})

function getInviteCodeFromOptions(options) {
  const directCode = options && (options.inviteCode || options.code)
  const sceneCode = parseScene(options && options.scene).inviteCode
  return String(directCode || sceneCode || '').trim().toUpperCase()
}

function parseScene(scene) {
  if (!scene) {
    return {}
  }

  const decoded = decodeURIComponent(String(scene))
  if (!decoded.includes('=')) {
    return { inviteCode: decoded }
  }

  return decoded.split('&').reduce((params, pair) => {
    const [key, value] = pair.split('=')
    if (key) {
      params[key] = value || ''
    }
    return params
  }, {})
}

function getFactoryInitial(name) {
  return String(name || '厂').trim().charAt(0) || '厂'
}

function buildFactoryStats(factory) {
  return [
    { label: '成员', value: `${factory.memberCount || 0}人` },
    { label: '工序', value: `${factory.processCount || 0}项` },
    { label: '路线', value: `${factory.routeCount || 0}条` }
  ]
}

function buildAvatars(name) {
  const chars = String(name || '计件猫')
    .replace(/\s/g, '')
    .split('')
    .slice(0, 3)

  while (chars.length < 3) {
    chars.push(['计', '件', '猫'][chars.length])
  }

  return chars.concat('厂')
}
