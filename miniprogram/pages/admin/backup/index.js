const api = require('../../../utils/api')

Page({
  data: {
    showRestore: false,
    restoring: false,
    histories: [],
    backupStatusTitle: '暂无备份',
    lastBackupText: '点击下方手动备份生成第一份数据备份',
    storageText: '暂无备份记录'
  },

  onLoad() {
    this.loadBackups()
  },

  onShow() {
    this.loadBackups()
  },

  backupNow() {
    wx.showLoading({ title: '备份中' })
    api.createBackup().then(() => {
      wx.hideLoading()
      wx.showToast({ title: '备份完成', icon: 'success' })
      this.loadBackups()
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '备份接口不可用', icon: 'none' })
    })
  },

  openRestore() {
    if (this.data.histories.length === 0) {
      wx.showToast({ title: '暂无可恢复备份', icon: 'none' })
      return
    }

    this.setData({ showRestore: true })
  },

  closeRestore() {
    this.setData({ showRestore: false, restoring: false })
  },

  confirmRestore() {
    const backup = this.data.histories[0]

    if (!backup || !backup.id) {
      wx.showToast({ title: '暂无可恢复备份', icon: 'none' })
      return
    }

    this.setData({ restoring: true })

    api.restoreBackup(backup && backup.id).then(() => {
      this.setData({ showRestore: false, restoring: false })
      wx.showToast({ title: '恢复完成', icon: 'success' })
    }).catch(() => {
      this.setData({ showRestore: false, restoring: false })
      wx.showToast({ title: '恢复失败', icon: 'none' })
    })
  },

  loadBackups() {
    api.getBackups().then((backups) => {
      const histories = (Array.isArray(backups) ? backups : []).map((item) => ({
        id: item.id,
        date: item.date || this.formatTime(item.createdAt),
        size: item.size || '未知大小',
        status: item.status || '手动备份'
      }))
      const latest = histories[0]

      this.setData({
        histories,
        backupStatusTitle: latest ? '备份正常' : '暂无备份',
        lastBackupText: latest ? `最近备份：${latest.date} · 保留30天` : '点击下方手动备份生成第一份数据备份',
        storageText: histories.length ? `已保留 ${histories.length} 个备份` : '暂无备份记录'
      })
    }).catch(() => {
      this.setData({
        histories: [],
        backupStatusTitle: '暂无备份',
        lastBackupText: '点击下方手动备份生成第一份数据备份',
        storageText: '暂无备份记录'
      })
    })
  },

  formatTime(value) {
    if (!value) {
      return ''
    }

    return value.replace('T', ' ').slice(5, 16)
  }
})
