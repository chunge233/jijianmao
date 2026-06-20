const api = require('../../../utils/api')

Page({
  data: {
    factoryName: '未命名工厂',
    factoryCode: '-',
    factoryInitial: '工',
    rows: [
      { label: '工厂名称', value: '未命名工厂' },
      { label: '工厂编码', value: '-' },
      { label: '所属行业', value: '计件制造' },
      { label: '所在地区', value: '未填写' },
      { label: '联系人', value: '管理员' }
    ],
    stats: [
      { label: '员工', value: '21' },
      { label: '工序', value: '18' },
      { label: '产品', value: '12' },
      { label: '路线', value: '8' }
    ]
  },

  onLoad() {
    this.loadFactoryInfo()
  },

  onShow() {
    this.loadFactoryInfo()
  },

  loadFactoryInfo() {
    api.getFactorySummary().then((res) => {
      if (!res || !res.factory) {
        return
      }

      const factory = res.factory
      const stats = res.stats || {}

      this.setData({
        factoryName: factory.name || this.data.factoryName,
        factoryCode: factory.inviteCode || factory.id,
        factoryInitial: (factory.name || '工').slice(0, 1),
        rows: [
          { label: '工厂名称', value: factory.name || '未命名工厂' },
          { label: '工厂编码', value: factory.inviteCode || factory.id },
          { label: '所属行业', value: '计件制造' },
          { label: '所在地区', value: '未填写' },
          { label: '联系人', value: '管理员' }
        ],
        stats: [
          { label: '员工', value: String(stats.employees || 0) },
          { label: '工序', value: String(stats.processes || 0) },
          { label: '产品', value: String(stats.products || 0) },
          { label: '路线', value: String(stats.routes || 0) }
        ]
      })
    }).catch(() => {})
  }
})
