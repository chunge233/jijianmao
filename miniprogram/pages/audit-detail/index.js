const api = require('../../utils/api')

Page({
  data: {
    reportId: '',
    workerName: '员工',
    workerInitial: '员',
    workerRole: '计件报工',
    status: 'pending',
    rows: [
      { label: '报工记录', value: '加载中' }
    ]
  },

  onLoad(options) {
    this.setData({
      reportId: (options && options.id) || ''
    })
    this.loadReport()
  },

  loadReport() {
    if (!this.data.reportId) {
      return
    }

    api.getReport(this.data.reportId).then((report) => {
      if (!report) {
        return
      }

      const firstItem = report.items && report.items[0] ? report.items[0] : {}
      const statusMap = {
        pending: '待审核',
        approved: '已通过',
        rejected: '已驳回',
        withdrawn: '已撤回'
      }

      this.setData({
        status: report.status,
        workerName: '报工员工',
        workerInitial: '报',
        workerRole: report.type === 'route' ? '工艺路线报工' : '单工序报工',
        rows: [
          { label: '报工编号', value: report.id },
          { label: '报工类型', value: report.type === 'route' ? '工艺路线' : '单工序' },
          { label: '工序名称', value: firstItem.processName || '多工序' },
          { label: '报工数量', value: `${report.quantity || 0} 件` },
          { label: '应计工资', value: `¥${(Number(report.totalCents || 0) / 100).toFixed(2)}`, highlight: true },
          { label: '审核状态', value: statusMap[report.status] || '待审核' },
          { label: '报工时间', value: this.formatTime(report.createdAt) }
        ]
      })
    }).catch(() => {})
  },

  approveReport() {
    if (!this.data.reportId) {
      return
    }

    api.approveReport(this.data.reportId).then(() => {
      wx.showToast({ title: '已通过', icon: 'success' })
      this.loadReport()
    }).catch(() => {
      wx.showToast({ title: '审核失败', icon: 'none' })
    })
  },

  rejectReport() {
    if (!this.data.reportId) {
      return
    }

    api.rejectReport(this.data.reportId, '数量或工序信息需要核对').then(() => {
      wx.showToast({ title: '已驳回', icon: 'none' })
      this.loadReport()
    }).catch(() => {
      wx.showToast({ title: '驳回失败', icon: 'none' })
    })
  },

  formatTime(value) {
    if (!value) {
      return ''
    }

    return value.replace('T', ' ').slice(0, 16)
  }
})
