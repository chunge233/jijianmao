Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
      observer(value) {
        if (value) {
          this.updateStep(0)
        }
      }
    },
    steps: {
      type: Array,
      value: [],
      observer() {
        this.updateStep(this.data.currentIndex)
      }
    },
    storageKey: {
      type: String,
      value: ''
    }
  },

  data: {
    currentIndex: 0,
    displayIndex: 1,
    currentStep: {}
  },

  methods: {
    updateStep(index) {
      const steps = this.properties.steps || []
      const currentStep = steps[index] || {}

      this.setData({
        currentIndex: index,
        displayIndex: index + 1,
        currentStep
      })
    },

    nextStep() {
      const nextIndex = this.data.currentIndex + 1

      if (nextIndex >= this.properties.steps.length) {
        this.triggerEvent('close')
        return
      }

      this.updateStep(nextIndex)
    },

    closeGuide() {
      this.triggerEvent('close')
    },

    neverShow() {
      if (this.properties.storageKey) {
        wx.setStorageSync(this.properties.storageKey, true)
      }

      this.triggerEvent('never')
    },

    noop() {
    }
  }
})
