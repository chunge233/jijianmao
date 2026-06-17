Page({
  data: {
    showRestore: false,
    restoring: false,
    histories: [
      { date: '今天 23:00', size: '18.2MB', status: '自动备份' },
      { date: '昨天 23:00', size: '18.0MB', status: '自动备份' },
      { date: '6月15日 16:30', size: '17.8MB', status: '手动备份' }
    ]
  },

  backupNow() {
    wx.showToast({ title: '正在创建备份', icon: 'none' })
  },

  openRestore() {
    this.setData({ showRestore: true })
  },

  closeRestore() {
    this.setData({ showRestore: false, restoring: false })
  },

  confirmRestore() {
    this.setData({ restoring: true })
    setTimeout(() => {
      this.setData({ showRestore: false, restoring: false })
      wx.showToast({ title: '恢复完成', icon: 'success' })
    }, 600)
  }
})
