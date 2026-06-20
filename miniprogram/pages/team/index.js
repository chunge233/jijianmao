const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')

const basePage = createPenPage(screens.team)

function cloneScreen() {
  return JSON.parse(JSON.stringify(screens.team))
}

Page({
  ...basePage,

  data: {
    screen: cloneScreen()
  },

  onLoad() {
    this.loadTeams()
  },

  onShow() {
    this.loadTeams()
  },

  loadTeams() {
    api.getTeams().then((teams) => {
      if (!Array.isArray(teams) || teams.length === 0) {
        return
      }

      const screen = cloneScreen()
      screen.sections = [
        {
          id: 'teams',
          type: 'list',
          title: '班组列表',
          items: teams.map((team) => ({
            title: team.name,
            desc: `${team.memberCount || 0}名员工 · 组长 ${team.leader || '未设置'}`,
            value: team.status === 'disabled' ? '停用' : '启用',
            short: '组',
            tone: 'green'
          }))
        }
      ]
      this.setData({ screen })
    }).catch(() => {})
  }
})
