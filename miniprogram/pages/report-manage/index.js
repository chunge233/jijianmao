Page({
  data: {
    tabs: [
      { label: '全部', active: true },
      { label: '待审核' },
      { label: '已通过' },
      { label: '未通过' }
    ],
    chips: ['全部类型', '单工序', '工艺路线'],
    activeTab: '全部',
    allRecords: [
      { id: 'R001', title: '产品质检', status: '已通过', tone: 'green', type: '单工序', typeTone: 'blue', count: '30 件', amount: '+¥10.50', note: '产品表面光滑无划痕，包装完好', worker: '张工', reviewer: '审核 赵文员', time: '今天 14:30', photo: true },
      { id: 'R002', title: '零件装配路线', status: '待审核', tone: 'amber', type: '工艺路线', typeTone: 'amber', count: '50 件', amount: '+¥15.00', worker: '李工', reviewer: '审核 —', time: '今天 10:15', photo: true },
      { id: 'R003', title: '包装检验', status: '已通过', tone: 'green', type: '单工序', typeTone: 'blue', count: '40 件', amount: '+¥8.00', worker: '王工', reviewer: '审核 赵文员', time: '昨天 16:00' },
      { id: 'R004', title: '切割', status: '未通过', tone: 'red', type: '单工序', typeTone: 'blue', count: '60 件', amount: '+¥24.00', note: '数量与实际不符，请核实后重新提交工单信息', worker: '张工', reviewer: '审核 赵文员', time: '昨天 09:20' },
      { id: 'R005', title: '成品组装路线', status: '已通过', tone: 'green', type: '工艺路线', typeTone: 'amber', count: '30 件', amount: '+¥33.00', worker: '赵工', reviewer: '审核 赵文员', time: '06/15 08:00', photo: true },
      { id: 'R006', title: '钻孔', status: '已通过', tone: 'green', type: '单工序', typeTone: 'blue', count: '80 件', amount: '+¥40.00', note: '合格', worker: '李工', reviewer: '审核 赵文员', time: '06/14 11:30' }
    ],
    records: []
  },

  onLoad() {
    this.filterRecords('全部')
  },

  switchTab(event) {
    const { label } = event.currentTarget.dataset
    this.filterRecords(label)
  },

  filterRecords(label) {
    const tabs = this.data.tabs.map((tab) => ({
      ...tab,
      active: tab.label === label
    }))
    const records = label === '全部'
      ? this.data.allRecords
      : this.data.allRecords.filter((item) => item.status === label)

    this.setData({
      activeTab: label,
      tabs,
      records
    })
  },

  openRecord(event) {
    const { id } = event.currentTarget.dataset

    wx.navigateTo({
      url: id === 'R002' || id === 'R005' ? '/pages/report-detail-route/index' : '/pages/report-detail-single/index'
    })
  },

  openFilter() {
    wx.navigateTo({
      url: '/pages/report-filter/index'
    })
  }
})
