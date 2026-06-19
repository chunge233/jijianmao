Component({
  properties: {
    screen: {
      type: Object,
      value: {}
    }
  },

  methods: {
    emitAction(event) {
      const { action, path, title } = event.currentTarget.dataset

      this.triggerEvent('action', {
        action,
        path,
        title
      })
    }
  }
})
