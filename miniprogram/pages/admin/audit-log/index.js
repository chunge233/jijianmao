const api = require('../../../utils/api')

Page({
  data: {
    chips: ['全部', '员工', '工价', '权限', '数据'],
    activeChip: '全部',
    allLogs: [
      { id: 'L001', category: '工价', tone: 'blue', user: '陈经理', action: '调整工序单价', detail: '裁剪 ¥0.40 → ¥0.45', time: '今天 11:20' },
      { id: 'L002', category: '员工', tone: 'green', user: '赵文员', action: '通过加入申请', detail: '周玲 加入一组', time: '今天 09:50' },
      { id: 'L003', category: '数据', tone: 'amber', user: '系统', action: '自动备份完成', detail: '备份大小 18.2MB', time: '昨天 23:00' },
      { id: 'L004', category: '权限', tone: 'blue', user: '陈经理', action: '修改角色权限', detail: '组长 增加报表权限', time: '6月15日 16:10' }
    ],
    logs: []
  },

  onLoad() {
    this.filterLogs('全部')
    this.loadLogs()
  },

  onShow() {
    this.loadLogs()
  },

  switchChip(event) {
    const { chip } = event.currentTarget.dataset
    this.filterLogs(chip)
  },

  filterLogs(chip) {
    const logs = chip === '全部'
      ? this.data.allLogs
      : this.data.allLogs.filter((item) => item.category === chip)

    this.setData({
      activeChip: chip,
      logs
    })
  },

  loadLogs() {
    api.getAuditLogs().then((logs) => {
      if (!Array.isArray(logs) || logs.length === 0) {
        return
      }

      this.setData({
        allLogs: logs.map((log) => this.normalizeLog(log))
      })
      this.filterLogs(this.data.activeChip)
    }).catch(() => {})
  },

  normalizeLog(log) {
    const toneMap = {
      员工: 'green',
      工价: 'blue',
      权限: 'blue',
      数据: 'amber'
    }

    return {
      id: log.id,
      category: log.category,
      tone: toneMap[log.category] || 'blue',
      user: log.user,
      action: log.action,
      detail: log.detail,
      time: this.formatTime(log.createdAt)
    }
  },

  formatTime(value) {
    if (!value) {
      return ''
    }

    return value.replace('T', ' ').slice(5, 16)
  },

  openDetail(event) {
    wx.navigateTo({ url: `/pages/admin/audit-log-detail/index?id=${event.currentTarget.dataset.id}` })
  }
})
