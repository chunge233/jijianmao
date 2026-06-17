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

module.exports = {
  syncTabBar
}
