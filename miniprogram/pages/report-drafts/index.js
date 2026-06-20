const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')

const basePage = createPenPage(screens.reportDrafts)

function cloneScreen() {
  return JSON.parse(JSON.stringify(screens.reportDrafts))
}

Page({
  ...basePage,

  data: {
    screen: cloneScreen()
  },

  onLoad() {
    this.loadDrafts()
  },

  onShow() {
    this.loadDrafts()
  },

  loadDrafts() {
    api.getReportDrafts().then((drafts) => {
      if (!Array.isArray(drafts) || drafts.length === 0) {
        return
      }

      const screen = cloneScreen()
      screen.sections = [
        {
          id: 'drafts',
          type: 'cards',
          title: '草稿列表',
          items: drafts.map((draft) => {
            const firstItem = draft.items && draft.items[0] ? draft.items[0] : {}
            const amountCents = (draft.items || []).reduce((sum, item) => sum + Number(item.subtotalCents || 0), 0)

            return {
              id: draft.id,
              title: `${firstItem.processName || '报工草稿'} ${(firstItem.quantity || 0)}件`,
              desc: `保存于 ${this.formatTime(draft.createdAt)}`,
              tag: '未提交',
              tagTone: 'amber',
              path: `/pages/report-resubmit/index?draftId=${draft.id}`,
              meta: [
                { label: '类型', value: draft.type === 'route' ? '工艺路线' : '单工序' },
                { label: '预估工资', value: `¥${(amountCents / 100).toFixed(2)}` }
              ]
            }
          })
        }
      ]

      this.setData({ screen })
    }).catch(() => {})
  },

  formatTime(value) {
    if (!value) {
      return ''
    }

    return value.replace('T', ' ').slice(5, 16)
  }
})
