Page({
  data: {
    applies: [
      { id: 'A001', initial: '周', name: '周玲', role: '工人', team: '一组', time: '今天 09:30', status: '待处理' },
      { id: 'A002', initial: '孙', name: '孙强', role: '组长', team: '二组', time: '昨天 18:20', status: '待处理' },
      { id: 'A003', initial: '何', name: '何敏', role: '财务', team: '财务组', time: '6月15日', status: '待处理' }
    ]
  },

  approve(event) {
    this.updateStatus(event.currentTarget.dataset.id, '已通过')
  },

  reject(event) {
    this.updateStatus(event.currentTarget.dataset.id, '已拒绝')
  },

  updateStatus(id, status) {
    const applies = this.data.applies.map((item) => {
      if (item.id !== id) {
        return item
      }

      return {
        ...item,
        status
      }
    })

    this.setData({ applies })
  }
})
