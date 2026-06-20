const api = require('../../../utils/api')

Page({
  data: {
    title: '调整工序单价',
    subtitle: '陈经理 · 今天 11:20',
    source: '来源：批量调价',
    changes: [
      { label: '工序单价', before: '¥0.40', after: '¥0.45' },
      { label: '生效范围', before: '未设置', after: '后续报工' },
      { label: '影响员工', before: '0人', after: '21人' }
    ]
  },

  onLoad(options) {
    this.logId = options && options.id
    this.loadLog()
  },

  loadLog() {
    if (!this.logId) {
      return
    }

    api.getAuditLog(this.logId).then((log) => {
      if (!log) {
        return
      }

      this.setData({
        title: log.action,
        subtitle: `${log.user} · ${this.formatTime(log.createdAt)}`,
        source: `来源：${log.category}`,
        changes: [
          { label: '操作类型', before: '未变更', after: log.action },
          { label: '操作详情', before: '-', after: log.detail },
          { label: '操作人', before: '-', after: log.user }
        ]
      })
    }).catch(() => {})
  },

  formatTime(value) {
    if (!value) {
      return ''
    }

    return value.replace('T', ' ').slice(5, 16)
  }
})
