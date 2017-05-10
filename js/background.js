'use strict'

const playing = new Map()

const setStatus = ({ id, status, title }) => {
  const entry = playing.get(id)

  if (!entry) {
    return
  }

  if (title !== undefined) {
    entry.title = title
  }

  entry.status = status

  info()
}

const register = ({ title, id, hostname }, tabId) => {
  playing.set(id, { status: 'paused', title, tabId, id, hostname })
  info()
  browser.browserAction.enable()
}

const unregister = ({ id }) => {
  playing.delete(id)
  info()

  if (playing.size === 0) {
    browser.browserAction.disable()
  }
}

const info = () => {
  browser.runtime.sendMessage({ info: 'playing', playing: [...playing.values()] })
}

const focusTab = ({ id }) => {
  browser.tabs.update(playing.get(id).tabId, { active: true })
}

const redirectToTab = (message) => {
  const entry = playing.get(message.id)

  browser.tabs.sendMessage(entry.tabId, message)
}

browser.runtime.onMessage.addListener((message, sender) => {
  switch (message.action) {
    case 'register':
      return register(message, sender.tab.id)
    case 'unregister':
      return unregister(message)
    case 'info':
      return info()
    case 'pause':
      return redirectToTab(message)
    case 'play':
      return redirectToTab(message)
    case 'focusTab':
      return focusTab(message)
  }

  if (message.status) {
    return setStatus(message)
  }
})

browser.tabs.onRemoved.addListener((tabId) => {
  playing.forEach((entry, id) => {
    if (entry.tabId === tabId) {
      playing.remove(id)
    }
  })
})

browser.browserAction.disable()