const { createPenPage } = require('../../utils/pen-page')
const screens = require('../../utils/pen-page-presets')
const api = require('../../utils/api')

const basePage = createPenPage(screens.permissionDetail)

function cloneScreen() {
  return JSON.parse(JSON.stringify(screens.permissionDetail))
}

Page({
  ...basePage,

  data: {
    screen: cloneScreen(),
    roleId: ''
  },

  onLoad(options) {
    this.setData({
      roleId: (options && options.id) || ''
    })
    this.loadRole()
  },

  loadRole() {
    if (!this.data.roleId) {
      this.showEmptyRole('缺少角色信息', '请从权限管理列表进入角色详情。')
      return
    }

    api.getRole(this.data.roleId).then((role) => {
      if (!role) {
        this.showEmptyRole('未找到角色', '该角色可能不存在或不属于当前工厂。')
        return
      }

      const screen = cloneScreen()
      screen.hero = {
        kicker: '角色',
        title: role.name,
        desc: role.summary,
        badge: `${role.count || 0}人`
      }
      screen.sections = [
        {
          id: 'permissions',
          type: 'list',
          title: '权限范围',
          items: (role.permissions || []).map((item) => ({
            title: item,
            desc: '当前角色已授权能力',
            tag: '已授权',
            tagTone: 'green'
          }))
        }
      ]
      screen.bottomActions = [
        { title: '编辑权限', path: `/pages/role-edit/index?id=${role.id}` }
      ]

      this.setData({ screen })
    }).catch(() => {
      this.showEmptyRole('角色加载失败', '请返回权限管理后重试。')
    })
  },

  showEmptyRole(title, desc) {
    const screen = cloneScreen()
    screen.hero = {
      kicker: '角色详情',
      title,
      desc,
      badge: '空'
    }
    screen.sections = [
      {
        id: 'empty',
        type: 'empty',
        title,
        desc
      }
    ]
    screen.bottomActions = [
      { title: '返回权限管理', path: '/pages/permission/index' }
    ]
    this.setData({ screen })
  }
})
