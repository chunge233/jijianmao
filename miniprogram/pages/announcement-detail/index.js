const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')

const basePage = createPenPage(screens.announcementDetail)

function cloneScreen() {
  return JSON.parse(JSON.stringify(screens.announcementDetail))
}

Page({
  ...basePage,

  data: {
    screen: cloneScreen(),
    announcementId: ''
  },

  onLoad(options) {
    this.setData({
      announcementId: (options && options.id) || ''
    })
    this.loadAnnouncement()
  },

  loadAnnouncement() {
    if (!this.data.announcementId) {
      this.showEmptyAnnouncement('缺少公告信息', '请从公告列表进入公告详情。')
      return
    }

    api.getAnnouncement(this.data.announcementId).then((announcement) => {
      if (!announcement) {
        this.showEmptyAnnouncement('未找到公告', '该公告可能已删除或不属于当前工厂。')
        return
      }

      const screen = cloneScreen()
      screen.hero = {
        kicker: announcement.author || '公告',
        title: announcement.title,
        desc: this.formatTime(announcement.createdAt),
        badge: announcement.status === 'draft' ? '草稿' : '已发布'
      }
      screen.sections = [
        {
          id: 'content',
          type: 'notice',
          tone: 'blue',
          heading: '公告内容',
          desc: announcement.content || '暂无内容'
        }
      ]
      screen.bottomActions = [
        { title: '编辑公告', path: `/pages/announcement-new/index?id=${announcement.id}` }
      ]

      this.setData({ screen })
    }).catch(() => {
      this.showEmptyAnnouncement('公告加载失败', '请返回公告列表后重试。')
    })
  },

  showEmptyAnnouncement(title, desc) {
    const screen = cloneScreen()
    screen.hero = {
      kicker: '公告详情',
      title,
      desc,
      badge: '空'
    }
    screen.sections = [
      {
        id: 'empty',
        type: 'empty',
        title,
        desc
      }
    ]
    screen.bottomActions = [
      { title: '返回公告列表', path: '/pages/announcement/index' }
    ]
    this.setData({ screen })
  },

  formatTime(value) {
    if (!value) {
      return ''
    }

    return value.replace('T', ' ').slice(0, 16)
  }
})
