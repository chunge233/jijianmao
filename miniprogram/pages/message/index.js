const { syncTabBar } = require('../../utils/tabbar')

Page({
  data: {
    messages: [
      {
        title: '公司消息',
        preview: '6月生产计划已发布，请各位员工查看排班安排',
        icon: '/assets/icons/buildings-blue.svg',
        tone: 'blue'
      },
      {
        title: '审核消息',
        preview: '产品质检 30件 已通过审核，记件工资 +¥10.50',
        icon: '/assets/icons/clipboard-amber.svg',
        tone: 'amber'
      },
      {
        title: '系统推送',
        preview: '计件猫 v2.3.0 已上线，新增工资明细导出功能',
        icon: '/assets/icons/bell-ringing-gray.svg',
        tone: 'gray'
      }
    ]
  },

  onShow() {
    syncTabBar(1)
  },

  openDetail() {
    wx.navigateTo({
      url: '/pages/message-detail/index'
    })
  }
})
