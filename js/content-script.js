'use strict'

const elements = new Map()
const ids = new Map()

const isMediaElement = (node) => node.tagName === 'AUDIO' || node.tagName === 'VIDEO'
const generateId = () => Date.now()

const pause = (id) => {
  const element = elements.get(id)

  if (element) {
    element.pause()
  }
}

const play = (id) => {
  const element = elements.get(id)

  if (element) {
    element.play()
  }
}

const getId = (element) => ids.get(element)

const sendStatus = (status, element) => {
  browser.runtime.sendMessage({ status, id: getId(element), title: extractTitle() })
}

const extractYoutubeTitle = () => {
  const $title = document.querySelector('#eow-title')

  if ($title) {
    return $title.innerText
  }

  return document.title
}

const extractTitle = () => {
  switch (window.location.hostname) {
    case 'www.youtube.com':
      return extractYoutubeTitle()
  }

  return document.title
}

const onPlaying = (event) => sendStatus('playing', event.target)
const onPaused = (event) => sendStatus('paused', event.target)
const onEnded = (event) => sendStatus('ended', event.target)

const getStatus = (element) => {
  if (element.paused) {
    return 'paused'
  }

  if (element.ended) {
    return 'ended'
  }

  return 'playing'
}

const registerElement = (element) => {
  const id = generateId()
  const hostname = window.location.hostname

  ids.set(element, id)
  elements.set(id, element)

  browser.runtime.sendMessage({
    action: 'register',
    id,
    hostname,
    title: extractTitle(),
    status: getStatus(element)
  })

  element.addEventListener('playing', onPlaying)
  element.addEventListener('pause', onPaused)
  element.addEventListener('ended', onEnded)
}

const unregisterElement = (element) => {
  const id = ids.get(element)

  ids.delete(element)
  elements.delete(id)

  browser.runtime.sendMessage({ action: 'unregister', id })

  element.removeEventListener('playing', onPlaying)
  element.removeEventListener('pause', onPaused)
  element.removeEventListener('ended', onEnded)
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    Array.from(mutation.addedNodes)
      .filter(isMediaElement)
      .forEach((element) => registerElement(element))

    Array.from(mutation.removedNodes)
      .filter(isMediaElement)
      .forEach((element) => unregisterElement(element))
  })
})

Array.from(document.querySelectorAll('audio, video'))
  .forEach((element) => registerElement(element))

observer.observe(document, {
  subtree: true,
  childList: true
})

browser.runtime.onMessage.addListener(({ action, id }) => {
  switch (action) {
    case 'pause':
      return pause(id)
    case 'play':
      return play(id)
  }
})

window.addEventListener('unload', () => {
  elements.forEach((element) => unregisterElement(element))
})