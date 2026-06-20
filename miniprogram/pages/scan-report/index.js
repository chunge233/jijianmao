const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')
const { ensureFactorySelected } = require('../../utils/session')

const screen = {
  ...screens.scanReport,
  bottomActions: [
    { title: '扫码识别', action: 'scanWorkOrder' },
    { title: '手动选择报工', type: 'secondary', path: '/pages/report/index' }
  ]
}
const basePage = createPenPage(screen)

Page({
  ...basePage,

  onShow() {
    ensureFactorySelected()
  },

  handleAction(event) {
    const { action } = event.detail || {}

    if (action === 'scanWorkOrder') {
      this.scanWorkOrder()
      return
    }

    basePage.handleAction.call(this, event)
  },

  scanWorkOrder() {
    wx.scanCode({
      onlyFromCamera: false,
      success: (res) => {
        this.openReportByQrResult(res.result)
      },
      fail: () => {
        wx.showToast({ title: '扫码已取消', icon: 'none' })
      }
    })
  },

  openReportByQrResult(result) {
    wx.showLoading({ title: '识别中' })

    api.resolveQr(result || '').then((resolved) => {
      wx.hideLoading()

      if (resolved && resolved.type === 'process' && resolved.process) {
        this.openReport({
          qrType: 'process',
          processId: resolved.process.id
        })
        return
      }

      if (resolved && resolved.type === 'route' && resolved.route) {
        this.openReport({
          qrType: 'route',
          routeId: resolved.route.id
        })
        return
      }

      this.openReportByParsedPayload(result)
    }).catch(() => {
      wx.hideLoading()
      this.openReportByParsedPayload(result)
    })
  },

  openReportByParsedPayload(result) {
    const payload = this.parseQrResult(result)

    if (!payload) {
      wx.showToast({ title: '未识别到有效二维码', icon: 'none' })
      return
    }

    this.openReport(payload)
  },

  parseQrResult(result) {
    const raw = result || ''
    const jsonPayload = this.parseJsonQr(raw)

    if (jsonPayload) {
      return jsonPayload
    }

    const queryPayload = this.parseQueryQr(raw)

    if (queryPayload) {
      return queryPayload
    }

    if (/^RT-/i.test(raw)) {
      return {
        qrType: 'route',
        routeCode: raw
      }
    }

    if (/^PJ-|^PROC-/i.test(raw)) {
      return {
        qrType: 'process',
        processCode: raw
      }
    }

    return null
  },

  parseJsonQr(raw) {
    try {
      const parsed = JSON.parse(raw)
      const qrType = parsed.qrType || parsed.type

      if (qrType === 'route') {
        return parsed.routeId || parsed.routeCode
          ? { qrType: 'route', routeId: parsed.routeId || '', routeCode: parsed.routeCode || '' }
          : null
      }

      if (qrType === 'process') {
        return parsed.processId || parsed.processCode
          ? { qrType: 'process', processId: parsed.processId || '', processCode: parsed.processCode || '' }
          : null
      }
    } catch (error) {
      return null
    }

    return null
  },

  parseQueryQr(raw) {
    const query = raw.includes('?') ? raw.split('?')[1] : raw
    const params = {}

    query.split('&').forEach((pair) => {
      const [key, value] = pair.split('=')

      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value)
      }
    })

    const qrType = params.qrType || params.type

    if (qrType === 'route') {
      return params.routeId || params.routeCode
        ? { qrType: 'route', routeId: params.routeId || '', routeCode: params.routeCode || '' }
        : null
    }

    if (qrType === 'process') {
      return params.processId || params.processCode
        ? { qrType: 'process', processId: params.processId || '', processCode: params.processCode || '' }
        : null
    }

    return null
  },

  openReport(params) {
    const query = Object.keys(params).filter((key) => params[key]).map((key) => {
      return `${key}=${encodeURIComponent(params[key])}`
    }).join('&')

    wx.navigateTo({
      url: `/pages/report/index?${query}`
    })
  }
})
