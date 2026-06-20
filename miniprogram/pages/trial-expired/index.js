Page({
  data: {
    daysLeft: 2,
    keepItems: [
      { title: '员工与权限', desc: '员工档案、角色权限完整保留', icon: '/assets/icons/users-three-blue.svg' },
      { title: '工序与工艺路线', desc: '产品、工序、路线继续可用', icon: '/assets/icons/tree-structure-purple.svg' },
      { title: '报工与工资数据', desc: '历史报工、工资明细不丢失', icon: '/assets/icons/clipboard-text-green.svg' }
    ],
    benefits: [
      '扫码报工与工艺路线报工',
      '工资核算与员工确认',
      '管理端审核和数据导出',
      '高级权限与多角色协作'
    ]
  },

  openSubscription() {
    wx.navigateTo({
      url: '/pages/subscription/index'
    })
  },

  openPay() {
    wx.navigateTo({
      url: '/pages/subscription-pay/index?planId=pro&planName=%E4%B8%93%E4%B8%9A%E7%89%88&cycle=yearly&employees=100&amount=930'
    })
  },

  delayUpgrade() {
    wx.showModal({
      title: '暂不升级？',
      content: '试用结束后，高级报表、导出和权限能力将暂停使用，历史数据会继续保留。',
      confirmText: '继续试用',
      cancelText: '返回',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '已保留试用状态',
            icon: 'none'
          })
        }
      }
    })
  }
})
