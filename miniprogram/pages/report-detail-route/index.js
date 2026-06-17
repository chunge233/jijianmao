Page({
  data: {
    steps: [
      { name: '切割', price: '¥0.10', count: '50', amount: '¥5.00' },
      { name: '钻孔', price: '¥0.12', count: '50', amount: '¥6.00' },
      { name: '装配', price: '¥0.08', count: '50', amount: '¥4.00', terminal: true }
    ],
    audit: [
      { label: '报工人', value: '李工' },
      { label: '审核员', value: '待分配' },
      { label: '审核状态', value: '待审核', tone: 'amber' },
      { label: '报工时间', value: '2026-06-17 10:15' }
    ],
    photos: [1, 2]
  }
})
