const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')

const basePage = createPenPage(screens.notificationPreference)

function cloneScreen() {
  return JSON.parse(JSON.stringify(screens.notificationPreference))
}

Page({
  ...basePage,

  data: {
    screen: cloneScreen(),
    preference: {
      reportAudit: true,
      salary: true,
      subscription: true,
      system: true
    }
  },

  onLoad() {
    this.loadPreference()
  },

  handleAction(event) {
    const { action } = event.detail || {}
    const key = action && action.replace('toggle:', '')

    if (key && key !== action) {
      this.togglePreference(key)
      return
    }

    basePage.handleAction.call(this, event)
  },

  loadPreference() {
    api.getNotificationPreferences().then((preference) => {
      if (!preference) {
        return
      }

      this.setData({ preference })
      this.renderScreen(preference)
    }).catch(() => {})
  },

  togglePreference(key) {
    const preference = {
      ...this.data.preference,
      [key]: !this.data.preference[key]
    }

    api.updateNotificationPreferences(preference).then((next) => {
      this.setData({ preference: next || preference })
      this.renderScreen(next || preference)
    }).catch(() => {
      this.setData({ preference })
      this.renderScreen(preference)
    })
  },

  renderScreen(preference) {
    const screen = cloneScreen()
    const rows = [
      { key: 'reportAudit', title: '审核结果提醒', desc: '报工通过或驳回时提醒' },
      { key: 'salary', title: '工资确认提醒', desc: '工资待确认时提醒' },
      { key: 'subscription', title: '套餐到期提醒', desc: '试用和套餐即将到期时提醒' },
      { key: 'system', title: '公告提醒', desc: '工厂发布公告时提醒' }
    ]

    screen.sections = [
      {
        id: 'preferences',
        type: 'list',
        title: '通知偏好',
        items: rows.map((row) => {
          const enabled = !!preference[row.key]

          return {
            title: row.title,
            desc: row.desc,
            tag: enabled ? '开启' : '关闭',
            tagTone: enabled ? 'green' : 'gray',
            action: `toggle:${row.key}`
          }
        })
      }
    ]

    this.setData({ screen })
  }
})
