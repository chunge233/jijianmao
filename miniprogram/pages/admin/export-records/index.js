Page({
  data: {
    records: [
      { name: '2026年6月工资报表.xlsx', scope: '全厂 · 21人 · 356条', time: '今天 10:30' },
      { name: '报工明细_20260615.xlsx', scope: '报工明细 · 82条', time: '昨天 18:12' },
      { name: '工序产出统计.xlsx', scope: '按工序汇总 · 18项', time: '6月14日' }
    ]
  },

  download(event) {
    wx.showToast({ title: `下载${event.currentTarget.dataset.name}`, icon: 'none' })
  }
})
