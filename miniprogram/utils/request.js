const env = require('../env')

function getBaseUrl() {
  const stored = wx.getStorageSync('api_base_url')
  if (stored) {
    return normalizeBaseUrl(stored)
  }

  const platform = getPlatform()
  const defaultUrl = platform === 'devtools'
    ? env.DEV_API_BASE_URL
    : (env.LAN_API_BASE_URL || env.DEV_API_BASE_URL)

  return normalizeBaseUrl(defaultUrl || 'http://127.0.0.1:3000')
}

function getPlatform() {
  try {
    const info = typeof wx.getDeviceInfo === 'function'
      ? wx.getDeviceInfo()
      : wx.getSystemInfoSync()
    return info.platform || ''
  } catch (error) {
    return ''
  }
}

function normalizeBaseUrl(value) {
  return String(value || '').replace(/\/$/, '')
}

function request(options) {
  const token = wx.getStorageSync('auth_token')
  const header = {
    'content-type': 'application/json',
    ...(options.header || {})
  }

  if (token) {
    header.Authorization = `Bearer ${token}`
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${getBaseUrl()}${options.url}`,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
          return
        }

        if (res.statusCode === 401) {
          wx.removeStorageSync('auth_token')
          wx.showToast({
            title: '登录已过期',
            icon: 'none'
          })
        }

        reject(res.data || { message: `请求失败 ${res.statusCode}` })
      },
      fail: (error) => {
        reject({
          ...error,
          message: error.errMsg || '网络连接失败',
          baseUrl: getBaseUrl()
        })
      }
    })
  })
}

module.exports = {
  request,
  getBaseUrl
}
