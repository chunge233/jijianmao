const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')

const basePage = createPenPage(screens.teamNew)

Page({
  ...basePage,

  handleAction(event) {
    const { action, title } = event.detail || {}

    if (action === 'save') {
      api.createTeam({
        name: '包装组',
        leader: '刘洋'
      }).then(() => {
        this.toastAndBack('班组已保存')
      }).catch(() => {
        basePage.handleSaveAction.call(this, title)
      })
      return
    }

    basePage.handleAction.call(this, event)
  }
})
