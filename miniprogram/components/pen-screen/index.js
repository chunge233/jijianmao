Component({
  properties: {
    screen: {
      type: Object,
      value: {},
      observer(value) {
        this.normalizeScreen(value)
      }
    }
  },

  data: {
    viewScreen: {
      title: '',
      rightIcon: ''
    }
  },

  lifetimes: {
    attached() {
      this.normalizeScreen(this.properties.screen)
    }
  },

  methods: {
    normalizeScreen(screen) {
      const nextScreen = screen || {}
      this.setData({
        viewScreen: {
          ...nextScreen,
          title: nextScreen.title || '',
          rightIcon: nextScreen.rightIcon || ''
        }
      })
    },

    emitAction(event) {
      const { action, id, path, title } = event.currentTarget.dataset

      this.triggerEvent('action', {
        action,
        id,
        path,
        title
      })
    }
  }
})
