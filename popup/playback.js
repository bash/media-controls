'use strict'

const { Component, h, render } = preact

const toggle = (id, status) => {
  const action = status === 'playing' ? 'pause' : 'play'

  chrome.runtime.sendMessage({ action, id })
}

const focusTab = (id) => {
  console.log(id)
  chrome.runtime.sendMessage({ action: 'focusTab', id })
}

const PlaybackItem = ({ item }) => {
  // TODO: focus tab when clicking on title
  return h(
    'div',
    { class: 'panel-playback-item' },
    h(
      'div',
      { class: 'button', onClick: () => toggle(item.id, item.status) },
      h(
        'img',
        { class: 'icon', src: `../assets/${item.status === 'playing' ? 'pause' : 'play'}.png` }
      )
    ),
    h(
      'div',
      { class: 'text', onClick: () => focusTab(item.id) },
      h(
        'div',
        { class: 'title' },
        item.title
      ),
      h(
        'div',
        { class: 'url' },
        item.hostname
      )
    )
  )
}

class PlaybackList extends Component {
  constructor () {
    super()

    this.state.playing = []
  }

  componentWillMount () {
    chrome.runtime.onMessage.addListener(({ info, playing }) => {
      if (info === 'playing') {
        this.setState({ playing })
      }
    })
  }

  render ({}, { playing }) {
    return h(
      'div',
      { class: 'panel' },
      h(
        'div',
        { class: 'panel-section panel-playback-list' },
        ...playing.map((item) => h(PlaybackItem, { item }))
      )
    )
  }
}

render(h(PlaybackList), document.body)
chrome.runtime.sendMessage({ action: 'info' })

