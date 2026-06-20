const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')

const basePage = createPenPage(screens.roleEdit)

Page({
  ...basePage,

  handleAction(event) {
    const { action, title } = event.detail || {}

    if (action === 'save') {
      api.createRole({ name: '自定义角色' }).then(() => {
        this.toastAndBack('角色已保存')
      }).catch(() => {
        basePage.handleSaveAction.call(this, title)
      })
      return
    }

    basePage.handleAction.call(this, event)
  }
})
