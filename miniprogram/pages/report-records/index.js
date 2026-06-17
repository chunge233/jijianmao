Page({
  data: {
    tabs: [
      { label: '全部', count: '76', active: true },
      { label: '待审核', count: '5' },
      { label: '已通过', count: '27' },
      { label: '未通过', count: '3' }
    ],
    chips: ['全部类型', '单工序', '工艺路线'],
    records: [
      {
        title: '产品质检',
        status: '已通过',
        tone: 'green',
        type: '单工序',
        count: '30 件',
        amount: '+¥10.50',
        note: '产品表面无明显划痕，包装完好',
        worker: '张工',
        reviewer: '审核员赵鑫',
        time: '今天 14:30',
        path: '/pages/report-detail-single/index'
      },
      {
        title: '零件装配路线',
        status: '待审核',
        tone: 'amber',
        type: '工艺路线',
        count: '50 件',
        amount: '+¥15.00',
        worker: '李工',
        reviewer: '审核一',
        time: '今天 10:15',
        path: '/pages/report-detail-route/index'
      },
      {
        title: '包装检验',
        status: '已通过',
        tone: 'green',
        type: '单工序',
        count: '40 件',
        amount: '+¥8.00',
        worker: '王工',
        reviewer: '审核员刘欢',
        time: '昨天 16:00',
        path: '/pages/report-detail-single/index'
      },
      {
        title: '切割',
        status: '未通过',
        tone: 'red',
        type: '单工序',
        count: '60 件',
        amount: '+¥24.00',
        note: '数量与实际不符，请核实后重新提交',
        worker: '张工',
        reviewer: '审核员赵文',
        time: '昨天 09:20',
        path: '/pages/report-detail-single/index'
      },
      {
        title: '成品组装路线',
        status: '已通过',
        tone: 'green',
        type: '工艺路线',
        count: '30 件',
        amount: '+¥33.00',
        worker: '赵工',
        reviewer: '审核员文亮',
        time: '06/15 08:00',
        path: '/pages/report-detail-route/index'
      }
    ]
  },

  openRecord(event) {
    const { path } = event.currentTarget.dataset

    if (!path) {
      return
    }

    wx.navigateTo({
      url: path
    })
  }
})
