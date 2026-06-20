const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')

const basePage = createPenPage(screens.employeeImport)

Page({
  ...basePage,

  handleAction(event) {
    const { path } = event.detail || {}

    if (path === '/pages/employee-import-preview/index') {
      wx.showLoading({ title: '校验中' })
      api.previewEmployeeImport().then((job) => {
        wx.hideLoading()
        wx.navigateTo({
          url: `/pages/employee-import-preview/index?id=${job.id}`
        })
      }).catch(() => {
        wx.hideLoading()
        wx.navigateTo({ url: path })
      })
      return
    }

    basePage.handleAction.call(this, event)
  }
})
