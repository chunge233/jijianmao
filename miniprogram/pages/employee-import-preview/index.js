const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')

const basePage = createPenPage(screens.employeeImportPreview)

function cloneScreen() {
  return JSON.parse(JSON.stringify(screens.employeeImportPreview))
}

Page({
  ...basePage,

  data: {
    screen: cloneScreen(),
    importId: ''
  },

  onLoad(options) {
    this.setData({
      importId: (options && options.id) || ''
    })
    this.loadImport()
  },

  loadImport() {
    if (!this.data.importId) {
      return
    }

    api.getEmployeeImport(this.data.importId).then((job) => {
      if (!job) {
        return
      }

      const screen = cloneScreen()
      screen.sections = [
        {
          id: 'summary',
          type: 'summary',
          items: [
            { label: '总行数', value: String(job.total || 0) },
            { label: '可导入', value: String(job.valid || 0) },
            { label: '重复手机号', value: String(job.duplicate || 0) },
            { label: '格式错误', value: String(job.invalid || 0) }
          ]
        },
        {
          id: 'rows',
          type: 'list',
          title: '可导入员工',
          items: (job.rows || []).map((row) => ({
            title: row.name,
            desc: `${this.maskPhone(row.phone)} · ${row.role === 'admin' ? '组长' : '员工'}`,
            tag: '可导入',
            tagTone: 'green'
          }))
        }
      ]
      screen.bottomActions = [
        { title: '重新上传', type: 'secondary', path: '/pages/employee-import/index' },
        { title: `确认导入 ${job.valid || 0} 人`, action: 'import' }
      ]

      this.setData({ screen })
    }).catch(() => {})
  },

  maskPhone(phone) {
    if (!phone || phone.length < 7) {
      return phone || '未绑定'
    }

    return `${phone.slice(0, 3)}****${phone.slice(-4)}`
  }
})
