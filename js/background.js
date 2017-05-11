'use strict'

const state = new Map()

const update = () => {
  if (state.size === 0) {
    browser.browserAction.disable()
    browser.browserAction.setBadgeText({ text: '' })
  } else {
    browser.browserAction.enable()
    browser.browserAction.setBadgeText({ text: `${state.size}` })
  }

  sendState()
}

const setEntry = ({ id, ...changes }) => {
  const entry = state.get(id) || {}
  console.log('merging', { id }, entry, changes)
  state.set(id, Object.assign({ id }, entry, changes))
  update()
}

const removeEntry = ({ id }) => {
  state.delete(id)
  update()
}

const sendState = () => {
  browser.runtime.sendMessage({ info: 'playing', playing: [...state.values()] })
}

const focusTab = async ({ id }) => {
  const { tabId } = state.get(id)
  const { windowId } = await browser.tabs.get(tabId)

  browser.tabs.update(tabId, { active: true })
  browser.windows.update(windowId, { focused: true })
}

const sendToTab = (message) => {
  const entry = state.get(message.id)

  browser.tabs.sendMessage(entry.tabId, message)
}

browser.runtime.onMessage.addListener((message, sender) => {
  switch (message.action) {
    case 'register':
      return setEntry(Object.assign({ tabId: sender.tab.id, status: 'paused' }, message))
    case 'unregister':
      return removeEntry(message)
    case 'info':
      return sendState()
    case 'pause':
      return sendToTab(message)
    case 'play':
      return sendToTab(message)
    case 'focusTab':
      return focusTab(message)
  }

  if (message.status) {
    return setEntry(message)
  }
})

browser.tabs.onRemoved.addListener((tabId) => {
  state.forEach((entry, id) => {
    if (entry.tabId === tabId) {
      removeEntry(id)
    }
  })
})

browser.browserAction.disable()