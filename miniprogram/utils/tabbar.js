function syncTabBar(selected, options) {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]

  if (!currentPage || typeof currentPage.getTabBar !== 'function') {
    return
  }

  const tabBar = currentPage.getTabBar()

  if (tabBar && typeof tabBar.setData === 'function') {
    tabBar.setData({
      selected,
      hidden: Boolean(options && options.hidden)
    })
  }
}

function hideTabBar() {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]

  if (currentPage && typeof currentPage.getTabBar === 'function') {
    const tabBar = currentPage.getTabBar()

    if (tabBar && typeof tabBar.setData === 'function') {
      tabBar.setData({
        hidden: true,
        showReportChooser: false
      })
    }
  }

  if (typeof wx.hideTabBar === 'function') {
    wx.hideTabBar({
      animation: false,
      fail() {}
    })
  }
}

module.exports = {
  hideTabBar,
  syncTabBar
}
