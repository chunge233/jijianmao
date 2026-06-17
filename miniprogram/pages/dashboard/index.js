Page({
  data: {
    metrics: [
      { label: '今日产出', value: '1,150件', icon: '/assets/icons/package-green.svg', tone: 'blue' },
      { label: '今日工资', value: '¥575.00', icon: '/assets/icons/currency-cny-green.svg', tone: 'green' },
      { label: '在岗人数', value: '12人', icon: '/assets/icons/users-three-blue.svg', tone: 'amber' },
      { label: '工序数量', value: '28项', icon: '/assets/icons/tree-structure-purple.svg', tone: 'purple' }
    ],
    ranks: [
      { rank: '1', name: '张伟', initial: '张', quantity: '220件', color: '#3B82F6' },
      { rank: '2', name: '李娜', initial: '李', quantity: '180件', color: '#8B5CF6' },
      { rank: '3', name: '王强', initial: '王', quantity: '165件', color: '#10B981' },
      { rank: '#4', name: '陈敏', initial: '陈', quantity: '150件', color: '#F97316' },
      { rank: '#5', name: '刘洋', initial: '刘', quantity: '140件', color: '#EC4899' }
    ],
    bars: [
      { label: '裁剪', value: '35%', width: '35%', color: '#3B82F6' },
      { label: '缝合', value: '28%', width: '28%', color: '#10B981' },
      { label: '质检', value: '15%', width: '15%', color: '#F59E0B' },
      { label: '包装', value: '12%', width: '12%', color: '#8B5CF6' },
      { label: '烫熨', value: '10%', width: '10%', color: '#6B7280' }
    ]
  }
})
