const api = require('../../utils/api')

Page({
  data: {
    messageId: '',
    category: '消息详情',
    title: '暂无消息',
    meta: '计件猫 · 消息中心',
    time: '',
    sourceId: '',
    paragraphs: [
      '请选择一条消息查看详情。'
    ]
  },

  onLoad(options) {
    this.setData({
      messageId: (options && options.id) || ''
    })
    this.loadMessage()
  },

  loadMessage() {
    if (!this.data.messageId) {
      return
    }

    api.getMessage(this.data.messageId).then((message) => {
      if (!message) {
        this.showEmptyMessage()
        return
      }

      const categoryMap = {
        audit: '审核消息',
        salary: '工资消息',
        subscription: '套餐消息',
        system: '系统推送'
      }

      this.setData({
        category: categoryMap[message.type] || '系统消息',
        title: message.title,
        meta: '计件猫 · 消息中心',
        time: this.formatTime(message.createdAt),
        sourceId: message.id,
        paragraphs: String(message.content || message.title || '').split('\n').filter(Boolean)
      })
    }).catch(() => {
      this.showEmptyMessage()
    })
  },

  showEmptyMessage() {
    this.setData({
      category: '消息详情',
      title: '消息不存在',
      meta: '计件猫 · 消息中心',
      time: '',
      sourceId: this.data.messageId || '',
      paragraphs: ['这条消息可能已被删除或暂时无法读取。']
    })
  },

  formatTime(value) {
    if (!value) {
      return ''
    }

    return value.replace('T', ' ').slice(0, 16)
  }
})
