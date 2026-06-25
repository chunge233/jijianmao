const icon = {
  bell: '/assets/icons/bell-gray.svg',
  buildings: '/assets/icons/buildings-blue.svg',
  camera: '/assets/icons/camera-blue.svg',
  check: '/assets/icons/check-green.svg',
  clipboard: '/assets/icons/clipboard-blue.svg',
  clipboardGreen: '/assets/icons/clipboard-text-green.svg',
  cloud: '/assets/icons/cloud-arrow-up-gray.svg',
  cny: '/assets/icons/currency-cny-green.svg',
  export: '/assets/icons/export-blue.svg',
  file: '/assets/icons/file-text-blue.svg',
  gear: '/assets/icons/gear-gray.svg',
  image: '/assets/icons/image-square-gray.svg',
  info: '/assets/icons/info-gray.svg',
  megaphone: '/assets/icons/megaphone-red.svg',
  package: '/assets/icons/package-green.svg',
  phone: '/assets/icons/phone-blue.svg',
  shield: '/assets/icons/shield-check-cyan.svg',
  stack: '/assets/icons/stack-gray.svg',
  tree: '/assets/icons/tree-structure-purple.svg',
  users: '/assets/icons/users-three-blue.svg',
  warning: '/assets/icons/warning-circle-amber.svg',
  x: '/assets/icons/x-circle-red.svg'
}

function formSection(title, fields) {
  return {
    id: `${title}-form`,
    type: 'form',
    title,
    fields
  }
}

function listSection(title, items, more, morePath) {
  return {
    id: `${title}-list`,
    type: 'list',
    title,
    more,
    morePath,
    items
  }
}

function cardSection(title, items) {
  return {
    id: `${title}-cards`,
    type: 'cards',
    title,
    items
  }
}

function saveActions(primaryTitle) {
  return [
    { title: '取消', type: 'secondary', action: 'back' },
    { title: primaryTitle || '保存', action: 'save' }
  ]
}

const processFields = [
  { label: '工序名称', value: '裁剪工序' },
  { label: '工序分类', value: '裁剪' },
  { label: '计价单位', value: '件' },
  { label: '默认单价', value: '¥0.50' },
  { label: '报工上限', value: '500 件/日' },
  { label: '工序说明', placeholder: '填写工序标准、质检要求和注意事项', multiline: true }
]

const productFields = [
  { label: '产品名称', value: '春季工装外套' },
  { label: '产品编号', value: 'P-202606-001' },
  { label: '产品分类', value: '服装加工' },
  { label: '默认路线', value: '裁剪-缝合-质检-包装' },
  { label: '备注', placeholder: '可填写尺码、颜色或客户批次要求', multiline: true }
]

const employeeRows = [
  { title: '员工A', desc: '生产组 · 员工 · 已绑定手机', tag: '在岗', tagTone: 'green', short: '员', tone: 'blue', path: '/pages/employee-detail/index' },
  { title: '员工B', desc: '生产组 · 组长 · 已绑定手机', tag: '在岗', tagTone: 'green', short: '员', tone: 'purple', path: '/pages/employee-detail/index' },
  { title: '员工C', desc: '质检组 · 员工 · 待确认', tag: '待确认', tagTone: 'amber', short: '员', tone: 'amber', path: '/pages/employee-detail/index' }
]

const reportCards = [
  {
    title: '产品质检 30件',
    desc: '单工序 · 2026-06-18 14:20',
    tag: '待审核',
    tagTone: 'amber',
    meta: [
      { label: '预估工资', value: '¥10.50' },
      { label: '提交人', value: '当前员工' }
    ]
  },
  {
    title: '春季工装外套 100件',
    desc: '工艺路线 · 裁剪-缝合-质检',
    tag: '已通过',
    tagTone: 'green',
    meta: [
      { label: '预估工资', value: '¥86.00' },
      { label: '审核人', value: '管理员' }
    ]
  }
]

const screens = {
  processNew: {
    title: '新增工序',
    sections: [
      formSection('基础信息', processFields),
      listSection('启用范围', [
        { title: '适用产品', desc: '全部产品', value: '可修改' },
        { title: '允许员工报工', desc: '员工端可见并可提交', tag: '开启', tagTone: 'green' }
      ])
    ],
    bottomActions: saveActions('保存工序')
  },

  processDetail: {
    title: '工序详情',
    hero: { kicker: '裁剪', title: '裁剪工序', desc: '¥0.50/件 · 报工上限 500件/日', badge: '启用' },
    sections: [
      {
        id: 'stats',
        type: 'metrics',
        title: '本月数据',
        items: [
          { label: '报工数量', value: '1,280件', tone: 'blue', icon: icon.clipboard },
          { label: '产生工资', value: '¥640.00', tone: 'green', icon: icon.cny }
        ]
      },
      listSection('关联信息', [
        { title: '适用产品', desc: '春季工装外套、夏季短袖', value: '2个' },
        { title: '使用路线', desc: '标准服装加工路线', value: '1条' },
        { title: '最近修改', desc: '2026-06-18 13:20', value: '王主管' }
      ])
    ],
    bottomActions: [
      { title: '停用', type: 'secondary', action: 'disable' },
      { title: '编辑', path: '/pages/process-new/index' }
    ]
  },

  productNew: {
    title: '新增产品',
    sections: [
      formSection('产品信息', productFields),
      {
        id: 'image',
        type: 'notice',
        tone: 'blue',
        icon: icon.image,
        heading: '产品图片',
        desc: '支持上传产品主图，便于员工报工时快速识别。'
      }
    ],
    bottomActions: saveActions('保存产品')
  },

  routeDetail: {
    title: '工艺路线详情',
    hero: { kicker: '标准路线', title: '工装外套加工路线', desc: '4道工序 · 适用 3 个产品', badge: '启用' },
    sections: [
      {
        id: 'steps',
        type: 'steps',
        title: '工序流程',
        items: [
          { title: '裁剪', desc: '¥0.50/件 · 负责人' },
          { title: '缝合', desc: '¥0.80/件 · 负责人' },
          { title: '质检', desc: '¥0.30/件 · 负责人' },
          { title: '包装', desc: '¥0.25/件 · 包装组负责' }
        ]
      },
      listSection('路线设置', [
        { title: '是否允许跳序', desc: '必须按顺序完成', tag: '关闭', tagTone: 'gray' },
        { title: '报工确认', desc: '每道工序提交后进入审核', tag: '开启', tagTone: 'green' }
      ])
    ],
    bottomActions: [
      { title: '复制路线', type: 'secondary', action: 'copy' },
      { title: '编辑路线', path: '/pages/route-edit/index' }
    ]
  },

  routeEdit: {
    title: '编辑工艺路线',
    sections: [
      formSection('路线信息', [
        { label: '路线名称', value: '工装外套加工路线' },
        { label: '适用产品', value: '春季工装外套、夏季短袖' },
        { label: '路线说明', placeholder: '说明路线适用范围和生产要求', multiline: true }
      ]),
      {
        id: 'steps',
        type: 'steps',
        title: '工序顺序',
        items: [
          { title: '裁剪', desc: '单价 ¥0.50/件' },
          { title: '缝合', desc: '单价 ¥0.80/件' },
          { title: '质检', desc: '单价 ¥0.30/件' },
          { title: '包装', desc: '单价 ¥0.25/件' }
        ]
      }
    ],
    bottomActions: saveActions('保存路线')
  },

  employeeNew: {
    title: '新增员工',
    sections: [
      formSection('员工信息', [
        { label: '姓名', value: '员工姓名' },
        { label: '手机号', value: '已绑定手机' },
        { label: '所属班组', value: '裁剪组' },
        { label: '角色权限', value: '员工' },
        { label: '备注', placeholder: '可填写岗位、入职时间或证件信息', multiline: true }
      ])
    ],
    bottomActions: saveActions('保存员工')
  },

  employeeDetail: {
    title: '员工详情',
    hero: { kicker: '生产组 · 员工', title: '员工姓名', desc: '已绑定手机 · 在岗', badge: '正常' },
    sections: [
      {
        id: 'stats',
        type: 'metrics',
        title: '本月产出',
        items: [
          { label: '报工数量', value: '220件', tone: 'blue', icon: icon.package },
          { label: '计件工资', value: '¥168.00', tone: 'green', icon: icon.cny }
        ]
      },
      cardSection('最近报工', reportCards)
    ],
    bottomActions: [
      { title: '停用员工', type: 'secondary', path: '/pages/employee-disable-confirm/index' },
      { title: '编辑资料', path: '/pages/employee-new/index' }
    ]
  },

  permissionDetail: {
    title: '权限角色详情',
    hero: { kicker: '角色', title: '车间主管', desc: '可管理审核、员工、工序和数据报表', badge: '8人' },
    sections: [
      listSection('权限范围', [
        { title: '报工审核', desc: '审核、驳回、撤回报工', tag: '已授权', tagTone: 'green' },
        { title: '员工管理', desc: '新增、停用、调整员工信息', tag: '已授权', tagTone: 'green' },
        { title: '工资确认', desc: '确认工资和处理异议', tag: '只读', tagTone: 'amber' }
      ]),
      listSection('成员', employeeRows)
    ],
    bottomActions: [
      { title: '删除角色', type: 'secondary', path: '/pages/delete-confirm/index' },
      { title: '编辑权限', path: '/pages/role-edit/index' }
    ]
  },

  roleEdit: {
    title: '角色权限编辑',
    sections: [
      formSection('角色信息', [
        { label: '角色名称', value: '车间主管' },
        { label: '角色说明', value: '负责车间日常生产和报工审核' }
      ]),
      listSection('权限开关', [
        { title: '报工审核', desc: '允许审核员工提交的报工', tag: '开启', tagTone: 'green' },
        { title: '计件配置', desc: '允许维护工序、产品和路线', tag: '开启', tagTone: 'green' },
        { title: '工资数据', desc: '允许查看工资报表', tag: '只读', tagTone: 'amber' }
      ])
    ],
    bottomActions: saveActions('保存权限')
  },

  announcementNew: {
    title: '新增公告',
    sections: [
      formSection('公告内容', [
        { label: '公告标题', value: '6月工价调整公告' },
        { label: '发布范围', value: '全体员工' },
        { label: '公告正文', placeholder: '输入公告内容，支持换行展示', multiline: true }
      ])
    ],
    bottomActions: [
      { title: '保存草稿', type: 'secondary', action: 'draft' },
      { title: '发布公告', action: 'publish' }
    ]
  },

  announcementDetail: {
    title: '公告详情',
    theme: 'white',
    sections: [
      {
        id: 'content',
        type: 'cards',
        items: [
          {
            title: '6月工价调整公告',
            desc: '因夏季订单结构调整，裁剪、质检工序单价自 2026-06-20 起更新。',
            tag: '已发布',
            tagTone: 'green',
            meta: [
              { label: '发布人', value: '王主管' },
              { label: '发布时间', value: '2026-06-18' }
            ]
          }
        ]
      },
      listSection('阅读情况', [
        { title: '已读员工', value: '26人', tone: 'green' },
        { title: '未读员工', value: '4人', tone: 'amber' }
      ])
    ],
    bottomActions: [
      { title: '撤回', type: 'secondary', action: 'withdraw' },
      { title: '编辑公告', path: '/pages/announcement-new/index' }
    ]
  },

  auditReject: {
    title: '审核驳回原因',
    sections: [
      {
        id: 'record',
        type: 'notice',
        tone: 'amber',
        icon: icon.warning,
        heading: '产品质检 30件',
        desc: '该报工数量与现场照片不一致，请确认后重新提交。'
      },
      formSection('驳回说明', [
        { label: '原因类型', value: '数量异常' },
        { label: '补充说明', value: '照片中只有 20 件，请重新拍照并提交。', multiline: true }
      ])
    ],
    bottomActions: [{ title: '知道了', action: 'back' }]
  },

  reportEmpty: {
    title: '报工记录',
    sections: [
      { id: 'empty', type: 'empty', icon: icon.clipboard, title: '暂无报工记录', desc: '完成一次报工后，记录会显示在这里。' }
    ],
    bottomActions: [{ title: '立即报工', path: '/pages/report/index' }]
  },

  reportFilter: {
    title: '报工记录-筛选',
    sections: [
      formSection('筛选条件', [
        { label: '日期范围', value: '2026-06-01 至 2026-06-18' },
        { label: '报工类型', value: '全部类型' },
        { label: '审核状态', value: '待审核、已通过、已驳回' },
        { label: '工序/产品', placeholder: '请输入工序或产品名称' }
      ])
    ],
    bottomActions: [
      { title: '重置', type: 'secondary', action: 'reset' },
      { title: '查看结果', path: '/pages/report-records/index' }
    ]
  },

  reportDrafts: {
    title: '报工草稿',
    sections: [
      cardSection('草稿列表', [
        {
          title: '产品质检 20件',
          desc: '保存于 2026-06-18 13:40',
          tag: '未提交',
          tagTone: 'amber',
          path: '/pages/report-resubmit/index',
          meta: [
            { label: '工序', value: '质检' },
            { label: '预估工资', value: '¥7.00' }
          ]
        }
      ])
    ]
  },

  reportFailure: {
    title: '提交失败',
    sections: [
      { id: 'empty', type: 'empty', icon: icon.x, title: '网络异常，报工未提交', desc: '请检查网络连接，或稍后从草稿继续提交。' }
    ],
    bottomActions: [
      { title: '保存草稿', type: 'secondary', path: '/pages/report-drafts/index' },
      { title: '重新提交', path: '/pages/report/index' }
    ]
  },

  reportResubmit: {
    title: '修改重提',
    sections: [
      formSection('报工信息', [
        { label: '报工类型', value: '单工序' },
        { label: '工序', value: '产品质检' },
        { label: '数量', value: '30件' },
        { label: '备注', value: '已补充现场照片。', multiline: true }
      ]),
      {
        id: 'hint',
        type: 'notice',
        tone: 'blue',
        icon: icon.info,
        heading: '提交后将再次进入审核流程',
        desc: '审核员会看到本次修改后的数量、照片和备注。'
      }
    ],
    bottomActions: saveActions('重新提交')
  },

  reportWithdraw: {
    title: '撤回报工弹窗',
    sections: [
      cardSection('报工记录', reportCards.slice(0, 1))
    ],
    modal: {
      tone: 'amber',
      icon: icon.warning,
      title: '确认撤回此次报工？',
      desc: '撤回后该报工记录将变为草稿状态，您可以修改后再次提交。',
      actions: [
        { title: '取消' },
        { title: '确认撤回', type: 'danger', action: 'withdraw' }
      ]
    }
  },

  scanReport: {
    title: '扫码报工',
    theme: 'dark',
    sections: [
      { id: 'scan', type: 'empty', icon: icon.camera, title: '对准工序或工艺路线二维码', desc: '工序码会直接选中单个工序，路线码会带出该路线的全部工序。' }
    ],
    bottomActions: [{ title: '手动选择报工', path: '/pages/report/index' }]
  },

  scannedReportForm: {
    title: '扫码后报工表单',
    sections: [
      {
        id: 'hint',
        type: 'notice',
        tone: 'green',
        icon: icon.check,
        heading: '已识别工单 WO-20260618-03',
        desc: '产品和工艺路线已自动填充，请确认数量后提交。'
      },
      formSection('报工信息', [
        { label: '产品', value: '春季工装外套' },
        { label: '工艺路线', value: '裁剪-缝合-质检-包装' },
        { label: '当前工序', value: '质检' },
        { label: '报工数量', value: '100件' }
      ])
    ],
    bottomActions: saveActions('提交报工')
  },

  salaryConfirmSuccess: {
    title: '工资确认成功',
    sections: [
      { id: 'empty', type: 'empty', icon: icon.check, title: '工资已确认', desc: '2026年6月工资已确认，后续如有异常可发起异议。' }
    ],
    bottomActions: [{ title: '返回工资', path: '/pages/salary/index' }]
  },

  messageSystem: {
    title: '系统消息列表',
    sections: [
      listSection('系统消息', [
        { title: '账号安全提醒', desc: '检测到新设备登录，请确认是否本人操作。', tag: '未读', tagTone: 'red', icon: icon.shield, path: '/pages/message-detail/index' },
        { title: '系统维护通知', desc: '今晚 23:00-23:30 将进行服务升级。', tag: '已读', tagTone: 'gray', icon: icon.info, path: '/pages/message-detail/index' }
      ])
    ]
  },

  messageCompany: {
    title: '公司消息列表',
    sections: [
      listSection('公司消息', [
        { title: '6月工价调整公告', desc: '裁剪、质检工序单价已更新。', tag: '公告', tagTone: 'blue', icon: icon.megaphone, path: '/pages/announcement-detail/index' },
        { title: '安全培训提醒', desc: '请本周五前完成线上安全培训。', tag: '提醒', tagTone: 'amber', icon: icon.bell, path: '/pages/message-detail/index' }
      ])
    ]
  },

  messageAudit: {
    title: '审核消息列表',
    sections: [
      listSection('审核消息', [
        { title: '报工已通过', desc: '产品质检 30件 已通过审核。', tag: '通过', tagTone: 'green', icon: icon.check, path: '/pages/report-detail-single/index' },
        { title: '报工被驳回', desc: '数量异常，请修改后重新提交。', tag: '驳回', tagTone: 'red', icon: icon.warning, path: '/pages/audit-reject/index' }
      ])
    ]
  },

  accountSecurity: {
    title: '账号安全',
    theme: 'white',
    sections: [
      listSection('安全设置', [
        { title: '登录手机号', desc: '已绑定手机', value: '已绑定', icon: icon.phone },
        { title: '登录密码', desc: '建议定期更新密码', value: '去修改', path: '/pages/forgot-password/index', icon: icon.shield },
        { title: '注销账号', desc: '清除账号及相关授权', value: '谨慎操作', path: '/pages/cancel-account/index', icon: icon.x }
      ])
    ]
  },

  clearCache: {
    title: '清除缓存',
    theme: 'white',
    sections: [
      { id: 'cache', type: 'notice', tone: 'blue', icon: icon.info, heading: '当前缓存 12.5MB', desc: '清除后不会影响云端报工、工资和工厂数据。' },
      listSection('可清除内容', [
        { title: '图片缓存', value: '8.2MB', tag: '建议清理', tagTone: 'green' },
        { title: '临时表单', value: '4.3MB', tag: '保留草稿', tagTone: 'amber' }
      ])
    ],
    bottomActions: [{ title: '确认清除', action: 'clear' }]
  },

  about: {
    title: '关于我们',
    theme: 'white',
    sections: [
      { id: 'empty', type: 'empty', icon: icon.info, title: '计件猫', desc: '面向工厂计件工资场景的小程序工具。当前版本 1.0.0。' },
      listSection('相关协议', [
        { title: '用户协议', path: '/pages/user-agreement/index' },
        { title: '隐私政策', path: '/pages/privacy-policy/index' },
        { title: '帮助与反馈', path: '/pages/help-feedback/index' }
      ])
    ]
  },

  forgotPassword: {
    title: '忘记密码',
    theme: 'white',
    sections: [
      formSection('重置密码', [
        { label: '手机号', value: '已绑定手机' },
        { label: '验证码', placeholder: '请输入短信验证码' },
        { label: '新密码', placeholder: '请输入 8-20 位新密码' }
      ])
    ],
    bottomActions: [{ title: '确认重置', action: 'resetPassword' }]
  },

  cancelAccount: {
    title: '注销账号',
    theme: 'white',
    sections: [
      { id: 'warning', type: 'notice', tone: 'red', icon: icon.warning, heading: '注销后不可恢复', desc: '账号资料、授权和本地缓存将被清除，请确认已处理完工厂事务。' },
      listSection('注销前确认', [
        { title: '没有待审核报工', tag: '已确认', tagTone: 'green' },
        { title: '没有未处理异议', tag: '已确认', tagTone: 'green' },
        { title: '已退出全部工厂', tag: '待确认', tagTone: 'amber' }
      ])
    ],
    bottomActions: [{ title: '确认注销', type: 'danger', action: 'cancelAccount' }]
  },

  userAgreement: {
    title: '用户协议',
    theme: 'white',
    sections: [
      cardSection('协议内容', [
        { title: '计件猫用户协议', desc: '使用计件猫即表示你同意本协议。平台将为工厂、管理员和员工提供计件报工、审核、工资统计等服务。' },
        { title: '服务规则', desc: '用户应确保提交的报工信息真实、准确，管理员应按工厂制度及时完成审核。' }
      ])
    ]
  },

  privacyPolicy: {
    title: '隐私政策',
    theme: 'white',
    sections: [
      cardSection('隐私政策', [
        { title: '信息收集', desc: '我们仅收集用于登录、工厂协作、报工审核和工资展示所需的信息。' },
        { title: '信息使用', desc: '手机号、姓名、工厂角色和报工记录仅用于计件工资业务场景。' }
      ])
    ]
  },

  helpFeedback: {
    title: '帮助与反馈',
    sections: [
      listSection('常见问题', [
        { title: '如何加入工厂？', desc: '由管理员发起成员邀请。' },
        { title: '报工被驳回怎么办？', desc: '查看驳回原因，修改后重新提交。' },
        { title: '工资金额有误怎么办？', desc: '在工资详情中提出异议。' }
      ]),
      listSection('反馈', [
        { title: '意见反馈', desc: '提交问题描述和截图', path: '/pages/feedback/index', icon: icon.file }
      ])
    ]
  },

  feedback: {
    title: '意见反馈',
    sections: [
      formSection('反馈内容', [
        { label: '问题类型', value: '功能建议' },
        { label: '联系方式', value: '已绑定手机' },
        { label: '问题描述', placeholder: '请描述遇到的问题或建议', multiline: true }
      ]),
      { id: 'upload', type: 'notice', tone: 'blue', icon: icon.image, heading: '上传截图', desc: '最多 3 张，有助于更快定位问题。' }
    ],
    bottomActions: [{ title: '提交反馈', action: 'submitFeedback' }]
  },

  factorySwitch: {
    title: '切换工厂',
    sections: [
      listSection('我的工厂', [
        { title: '当前工厂', desc: '管理员 · 当前使用', tag: '当前', tagTone: 'blue', icon: icon.buildings },
        { title: '已加入工厂', desc: '员工 · 已加入', value: '切换', icon: icon.buildings, action: 'switchFactory' }
      ])
    ]
  },

  factoryExit: {
    title: '退出工厂',
    sections: [
      { id: 'warning', type: 'notice', tone: 'amber', icon: icon.warning, heading: '退出当前工厂', desc: '退出后将无法查看该工厂的报工、工资和消息。' },
      formSection('确认信息', [
        { label: '当前身份', value: '员工' },
        { label: '退出原因', placeholder: '请填写退出原因', multiline: true }
      ])
    ],
    bottomActions: [{ title: '确认退出', type: 'danger', action: 'exitFactory' }]
  },

  inviteMember: {
    title: '邀请成员',
    sections: [
      { id: 'code', type: 'notice', tone: 'blue', icon: icon.users, heading: '成员邀请', desc: '把工厂邀请发送给同事，便于快速加入团队。' },
      listSection('邀请设置', [
        { title: '默认角色', value: '员工' },
        { title: '有效期', value: '7天' },
        { title: '是否需要审核', tag: '需要', tagTone: 'green' }
      ])
    ],
    bottomActions: [{ title: '发送邀请', action: 'shareInvite', openType: 'share' }]
  },

  joinApproval: {
    title: '加入申请审批',
    sections: [
      cardSection('申请列表', [
        {
          title: '新成员申请加入',
          desc: '已绑定手机 · 申请角色：员工',
          tag: '待审批',
          tagTone: 'amber',
          meta: [
            { label: '申请时间', value: '今天 10:30' },
            { label: '来源', value: '邀请' }
          ]
        }
      ])
    ],
    bottomActions: [
      { title: '拒绝', type: 'secondary', action: 'reject' },
      { title: '同意加入', action: 'approve' }
    ]
  },

  subscription: {
    title: '套餐与订阅',
    hero: { kicker: '当前套餐', title: '专业版试用', desc: '剩余 12 天 · 支持 100 名员工', badge: '试用中' },
    sections: [
      cardSection('套餐选择', [
        { title: '基础版', desc: '适合小团队试用', tag: '¥99/月', tagTone: 'blue' },
        { title: '专业版', desc: '员工、审核、工资报表全量能力', tag: '推荐', tagTone: 'green' },
        { title: '旗舰版', desc: '多工厂、数据导出和高级权限', tag: '联系销售', tagTone: 'amber' }
      ])
    ],
    bottomActions: [{ title: '升级专业版', path: '/pages/subscription-pay/index' }]
  },

  subscriptionPay: {
    title: '确认订单',
    sections: [
      {
        id: 'order',
        type: 'summary',
        items: [
          { label: '套餐', value: '专业版' },
          { label: '周期', value: '12个月' },
          { label: '员工数', value: '100人' },
          { label: '应付金额', value: '¥930' }
        ]
      },
      { id: 'hint', type: 'notice', tone: 'blue', icon: icon.info, heading: '支付即开通', desc: '支付成功后专业版权益立即生效。' }
    ],
    bottomHint: '支付即视为同意《服务订购协议》',
    bottomActions: [{ title: '确认支付 ¥930', action: 'pay' }]
  },

  bills: {
    title: '账单与发票',
    sections: [
      cardSection('账单记录', [
        { title: '专业版年付', desc: '2026-06-18 15:20', tag: '已支付', tagTone: 'green', meta: [{ label: '金额', value: '¥930' }, { label: '发票', value: '可申请' }] },
        { title: '基础版月付', desc: '2026-05-18 09:10', tag: '已支付', tagTone: 'green', meta: [{ label: '金额', value: '¥99' }, { label: '发票', value: '已开具' }] }
      ])
    ]
  },

  trialExpired: {
    title: '试用到期挽留',
    sections: [
      { id: 'notice', type: 'empty', icon: icon.warning, title: '试用即将到期', desc: '开通专业版后可继续使用工资报表、数据导出和高级权限。' }
    ],
    modal: {
      tone: 'blue',
      icon: icon.info,
      title: '保留当前工厂数据',
      desc: '升级后所有员工、工序、报工和工资数据都会继续保留。',
      actions: [
        { title: '暂不升级' },
        { title: '立即开通', type: 'primary', path: '/pages/subscription-pay/index' }
      ]
    }
  },

  team: {
    title: '班组管理',
    sections: [
      listSection('班组列表', [
        { title: '生产一组', desc: '8名员工 · 已设组长', value: '220件', icon: icon.users },
        { title: '生产二组', desc: '12名员工 · 已设组长', value: '180件', icon: icon.users },
        { title: '质检组', desc: '5名员工 · 已设组长', value: '165件', icon: icon.users }
      ])
    ],
    bottomActions: [{ title: '新增班组', path: '/pages/team-new/index' }]
  },

  teamNew: {
    title: '新增班组',
    sections: [
      formSection('班组信息', [
        { label: '班组名称', value: '包装组' },
        { label: '班组长', value: '待选择' },
        { label: '班组成员', value: '5人' },
        { label: '备注', placeholder: '填写班组职责或排班说明', multiline: true }
      ])
    ],
    bottomActions: saveActions('保存班组')
  },

  employeeImport: {
    title: '批量导入员工',
    sections: [
      { id: 'notice', type: 'notice', tone: 'blue', icon: icon.cloud, heading: '上传员工表格', desc: '支持 .xlsx/.csv，字段包括姓名、手机号、班组、角色。' },
      listSection('导入步骤', [
        { title: '下载模板', desc: '使用标准模板减少导入错误', value: '去下载' },
        { title: '上传文件', desc: '当前未选择文件', value: '选择' },
        { title: '校验数据', desc: '上传后自动检查手机号和角色', value: '待执行' }
      ])
    ],
    bottomActions: [{ title: '下一步', path: '/pages/employee-import-preview/index' }]
  },

  employeeImportPreview: {
    title: '导入预览',
    sections: [
      {
        id: 'summary',
        type: 'summary',
        items: [
          { label: '总行数', value: '32' },
          { label: '可导入', value: '29' },
          { label: '重复手机号', value: '2' },
          { label: '格式错误', value: '1' }
        ]
      },
      listSection('异常数据', [
        { title: '第 12 行', desc: '手机号格式不正确', tag: '错误', tagTone: 'red' },
        { title: '第 18 行', desc: '与现有员工手机号重复', tag: '重复', tagTone: 'amber' }
      ])
    ],
    bottomActions: [
      { title: '重新上传', type: 'secondary', path: '/pages/employee-import/index' },
      { title: '确认导入 29 人', action: 'import' }
    ]
  },

  bossDashboard: {
    title: '经营看板',
    hero: { kicker: '2026年6月', title: '¥86,420', desc: '本月计件工资支出', badge: '+12%' },
    sections: [
      {
        id: 'metrics',
        type: 'metrics',
        title: '核心指标',
        items: [
          { label: '产出件数', value: '18,920', tone: 'blue', icon: icon.package },
          { label: '报工笔数', value: '486', tone: 'purple', icon: icon.clipboard },
          { label: '在岗人数', value: '68', tone: 'green', icon: icon.users },
          { label: '待审核', value: '24', tone: 'amber', icon: icon.warning }
        ]
      },
      {
        id: 'progress',
        type: 'progress',
        title: '工序占比',
        items: [
          { label: '裁剪', value: '35%', width: '35%', color: '#3B82F6' },
          { label: '缝合', value: '28%', width: '28%', color: '#10B981' },
          { label: '质检', value: '15%', width: '15%', color: '#F97316' },
          { label: '包装', value: '12%', width: '12%', color: '#8B5CF6' }
        ]
      }
    ]
  },

  notificationPreference: {
    title: '通知偏好',
    theme: 'white',
    sections: [
      listSection('员工通知', [
        { title: '审核结果提醒', desc: '报工通过或驳回时提醒', tag: '开启', tagTone: 'green', icon: icon.bell },
        { title: '工资确认提醒', desc: '工资待确认时提醒', tag: '开启', tagTone: 'green', icon: icon.cny },
        { title: '公告提醒', desc: '工厂发布公告时提醒', tag: '关闭', tagTone: 'gray', icon: icon.megaphone }
      ])
    ]
  },

  noPermission: {
    title: '无权限状态',
    sections: [
      { id: 'empty', type: 'empty', icon: icon.shield, title: '暂无访问权限', desc: '当前账号没有访问该功能的权限，请联系工厂管理员开通。' }
    ],
    bottomActions: [{ title: '返回首页', action: 'switchTabHome' }]
  },

  loadingError: {
    title: '加载与错误状态',
    sections: [
      { id: 'loading', type: 'notice', tone: 'blue', icon: icon.cloud, heading: '正在同步数据', desc: '请保持网络连接，系统会自动刷新最新报工和工资。' },
      { id: 'error', type: 'empty', icon: icon.x, title: '数据加载失败', desc: '网络异常或服务暂时不可用，请稍后重试。' }
    ],
    bottomActions: [{ title: '重新加载', action: 'reload' }]
  },

  deleteConfirm: {
    title: '删除确认弹窗',
    sections: [
      cardSection('待删除项目', [{ title: '裁剪工序', desc: '删除后不可继续用于报工。', tag: '启用中', tagTone: 'green' }])
    ],
    modal: {
      tone: 'red',
      icon: icon.warning,
      title: '确认删除？',
      desc: '删除后无法恢复，已产生报工记录的数据不会被删除。',
      actions: [
        { title: '取消' },
        { title: '确认删除', type: 'danger', action: 'delete' }
      ]
    }
  },

  employeeDisableConfirm: {
    title: '员工停用确认',
    sections: [
      cardSection('员工信息', [{ title: '员工姓名', desc: '生产组 · 员工 · 已绑定手机', tag: '在岗', tagTone: 'green' }])
    ],
    modal: {
      tone: 'amber',
      icon: icon.warning,
      title: '确认停用该员工？',
      desc: '停用后员工将无法继续报工，但历史记录和工资数据会保留。',
      actions: [
        { title: '取消' },
        { title: '确认停用', type: 'danger', action: 'disableEmployee' }
      ]
    }
  },

  dataExport: {
    title: '数据导出',
    sections: [
      formSection('导出条件', [
        { label: '数据类型', value: '报工记录' },
        { label: '日期范围', value: '2026-06-01 至 2026-06-18' },
        { label: '文件格式', value: 'Excel (.xlsx)' }
      ]),
      { id: 'hint', type: 'notice', tone: 'blue', icon: icon.export, heading: '导出预计 2-5 分钟内完成', desc: '完成后可在导出记录中下载。' }
    ],
    bottomActions: [{ title: '申请导出', action: 'export' }]
  },

  batchPriceConfirm: {
    title: '批量调价-确认弹层',
    sections: [
      cardSection('调价摘要', [
        { title: '共 8 个工序将被调整', desc: '裁剪、缝合、质检等工序单价将按新价格生效。', tag: '待确认', tagTone: 'amber' }
      ])
    ],
    modal: {
      tone: 'amber',
      icon: icon.warning,
      title: '确认批量调价？',
      desc: '调价后仅影响新提交的报工，历史工资不受影响。',
      actions: [
        { title: '取消' },
        { title: '确认调价', type: 'primary', action: 'confirmPrice' }
      ]
    }
  }
}

module.exports = screens
