Page({
  data: {
    tabs: [
      { label: '待处理', count: 3, active: true },
      { label: '已处理', count: 8 }
    ],
    currentTab: 0,
    allDisputes: [
      { id: 'D001', initial: '李', name: '李娜', reason: '工价异议 · 缝合工序', status: '待处理', tone: 'amber', time: '今天 14:30' },
      { id: 'D002', initial: '王', name: '王强', reason: '数量争议 · 质检工序', status: '待处理', tone: 'amber', time: '今天 10:15' },
      { id: 'D003', initial: '刘', name: '刘洋', reason: '单价核算异议 · 裁剪工序', status: '待处理', tone: 'amber', time: '昨天 16:00' },
      { id: 'D004', initial: '张', name: '张伟', reason: '工价异议 · 包装工序', status: '已处理', tone: 'green', time: '昨天 09:00' },
      { id: 'D005', initial: '陈', name: '陈敏', reason: '数量争议 · 烫熨工序', status: '已处理', tone: 'green', time: '6月14日' }
    ],
    disputes: []
  },

  onLoad() {
    this.filterDisputes(0)
  },

  switchTab(event) {
    const { index } = event.currentTarget.dataset
    this.filterDisputes(index)
  },

  filterDisputes(index) {
    const tabs = this.data.tabs.map((tab, tabIndex) => ({
      ...tab,
      active: tabIndex === index
    }))
    const status = index === 0 ? '待处理' : '已处理'
    const disputes = this.data.allDisputes.filter((item) => item.status === status)

    this.setData({
      currentTab: index,
      tabs,
      disputes
    })
  },

  openDispute(event) {
    const { id } = event.currentTarget.dataset

    wx.showToast({
      title: `异议 ${id}`,
      icon: 'none'
    })
  }
})
