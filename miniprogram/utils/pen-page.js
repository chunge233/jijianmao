const api = require('./api')

function createPenPage(screen) {
  return {
    data: {
      screen
    },

    handleAction(event) {
      const { action, path, title } = event.detail || {}

      if (path) {
        wx.navigateTo({
          url: path
        })
        return
      }

      if (action === 'back') {
        wx.navigateBack()
        return
      }

      if (action === 'switchTabHome') {
        wx.switchTab({
          url: '/pages/home/index'
        })
        return
      }

      this.handlePresetAction(action, title)
    },

    handlePresetAction(action, title) {
      const actionMap = {
        save: () => this.handleSaveAction(title),
        publish: () => this.toastAndBack('已发布'),
        draft: () => this.saveDraft(),
        reset: () => wx.showToast({ title: '已重置筛选', icon: 'none' }),
        clear: () => this.confirmBackendAction('确认清除缓存？', '清除后不会影响云端数据。', '已清除缓存', () => api.clearCache()),
        resetPassword: () => this.backendToastAndBack(() => api.resetPassword({}), '密码已重置'),
        cancelAccount: () => this.confirmBackendAction('确认注销账号？', '注销后将清除账号登录态和相关授权。', '账号已注销', () => api.cancelAccount(), '/pages/login/index', () => {
          wx.removeStorageSync('auth_token')
          wx.removeStorageSync('current_user')
          wx.removeStorageSync('current_factory')
        }),
        exitFactory: () => this.confirmBackendAction('确认退出工厂？', '退出后将返回工厂选择页。', '已退出工厂', () => api.exitCurrentFactory(), '/pages/factory-select/index'),
        delete: () => wx.showToast({ title: '缺少删除对象', icon: 'none' }),
        disable: () => wx.showToast({ title: '缺少停用对象', icon: 'none' }),
        disableEmployee: () => wx.showToast({ title: '缺少员工信息', icon: 'none' }),
        withdraw: () => wx.showToast({ title: '缺少报工记录', icon: 'none' }),
        copy: () => wx.showToast({ title: '已复制路线', icon: 'none' }),
        copyInvite: () => this.copyInviteCode(),
        switchFactory: () => wx.showToast({ title: '请选择工厂', icon: 'none' }),
        approve: () => wx.showToast({ title: '暂无待审批申请', icon: 'none' }),
        reject: () => wx.showToast({ title: '暂无待审批申请', icon: 'none' }),
        import: () => this.importEmployees(),
        export: () => this.backendToast(() => api.createExport('报工记录'), '已申请导出'),
        confirmPrice: () => wx.showToast({ title: '缺少调价单', icon: 'none' }),
        pay: () => wx.navigateTo({ url: '/pages/subscription-pay/index' }),
        submitFeedback: () => this.backendToastAndBack(() => api.submitFeedback('用户提交反馈'), '反馈已提交'),
        reload: () => wx.showToast({ title: '已重新加载', icon: 'none' })
      }

      if (actionMap[action]) {
        actionMap[action]()
        return
      }

      wx.showToast({
        title: title || '操作完成',
        icon: 'none'
      })
    },

    handleSaveAction(title) {
      if (title === '提交报工' || title === '重新提交') {
        wx.navigateTo({
          url: '/pages/report/index'
        })
        return
      }

      this.toastAndBack(title ? title.replace(/^保存/, '已保存') : '已保存')
    },

    saveDraft() {
      this.backendToast(() => {
        return api.getProcesses().then((processes) => {
          const process = Array.isArray(processes) ? processes.find((item) => item.status !== 'disabled') : null

          if (!process) {
            throw new Error('NO_PROCESS')
          }

          return api.createReportDraft({
            type: 'process',
            items: [{ processId: process.id, quantity: 1 }],
            remark: '草稿报工'
          })
        })
      }, '已保存草稿')
    },

    importEmployees() {
      const importId = this.data && this.data.importId
      const request = importId
        ? api.confirmEmployeeImport(importId)
        : api.previewEmployeeImport().then((job) => api.confirmEmployeeImport(job.id))

      request.then(() => {
        this.toastAndBack('已导入员工')
      }).catch(() => {
        wx.showToast({ title: '导入失败', icon: 'none' })
      })
    },

    copyInviteCode() {
      const factory = wx.getStorageSync('current_factory') || {}
      if (factory.inviteCode) {
        this.copyText(factory.inviteCode, '邀请已复制')
        return
      }

      api.createInvitation({
        name: '新成员',
        phone: '',
        role: 'employee'
      }).then((res) => {
        this.copyText((res && res.inviteCode) || '', '邀请已复制')
      }).catch(() => {
        wx.showToast({ title: '邀请获取失败', icon: 'none' })
      })
    },

    backendToast(requestFactory, title) {
      requestFactory().then(() => {
        wx.showToast({ title, icon: 'none' })
      }).catch((error) => {
        wx.showToast({ title: error.message === 'NO_PROCESS' ? '请先创建工序' : '操作失败', icon: 'none' })
      })
    },

    backendToastAndBack(requestFactory, title) {
      requestFactory().then(() => {
        this.toastAndBack(title)
      }).catch(() => {
        wx.showToast({ title: '操作失败', icon: 'none' })
      })
    },

    toastAndBack(title) {
      wx.showToast({
        title,
        icon: 'none'
      })

      setTimeout(() => {
        const pages = getCurrentPages()
        if (pages.length > 1) {
          wx.navigateBack()
        }
      }, 450)
    },

    confirmBackendAction(title, content, successTitle, requestFactory, redirectUrl, afterSuccess) {
      wx.showModal({
        title,
        content,
        confirmText: '确认',
        success: (res) => {
          if (!res.confirm) {
            return
          }

          requestFactory().then(() => {
            if (afterSuccess) {
              afterSuccess()
            }

            wx.showToast({
              title: successTitle,
              icon: 'none'
            })

            if (redirectUrl) {
              setTimeout(() => {
                wx.redirectTo({
                  url: redirectUrl
                })
              }, 450)
            }
          }).catch(() => {
            wx.showToast({
              title: '操作失败',
              icon: 'none'
            })
          })
        }
      })
    },

    confirmAction(title, content, successTitle, redirectUrl) {
      wx.showModal({
        title,
        content,
        confirmText: '确认',
        success: (res) => {
          if (!res.confirm) {
            return
          }

          wx.showToast({
            title: successTitle,
            icon: 'none'
          })

          if (redirectUrl) {
            setTimeout(() => {
              wx.redirectTo({
                url: redirectUrl
              })
            }, 450)
          }
        }
      })
    },

    copyText(data, title) {
      wx.setClipboardData({
        data,
        success: () => {
          wx.showToast({
            title,
            icon: 'none'
          })
        }
      })
    }
  }
}

module.exports = {
  createPenPage
}
