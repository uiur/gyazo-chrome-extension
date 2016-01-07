const delegate = require('delegate')
const style = require('dom-style')
const extend = require('xtend')

function gyazoIdFromUrl (str) {
  let parsedUrl = ''
  try {
    parsedUrl = new window.URL(str)
  } catch (e) {
    return
  }

  if ((/^(.+\.)?gyazo\.com$/).test(parsedUrl.host) && (/^\/[0-9a-f]+$/).test(parsedUrl.pathname)) {
    return parsedUrl.pathname.slice(1)
  }
}

function fetchImage (url, callback) {
  chrome.runtime.sendMessage(chrome.runtime.id, {
    action: 'gyazoGetImageBlob',
    gyazoUrl: url
  }, (response) => {
    const xhr = new window.XMLHttpRequest()
    xhr.open('GET', response.imageBlobUrl, true)
    xhr.responseType = 'arraybuffer'
    xhr.onload = () => {
      const blob = new window.Blob([xhr.response], { type: 'image/png' })

      callback(null, blob)
    }
    xhr.onerror = (e) => {
      callback(e)
    }
    xhr.send()
  })
}

function adjacentStyle (element) {
  const rect = element.getBoundingClientRect()

  const offsetY = 10
  const centerY = Math.floor(window.innerHeight / 2)

  if (rect.top > centerY) {
    return {
      left: rect.left + 'px',
      bottom: Math.round((window.innerHeight - rect.top + offsetY)) + 'px',
      maxHeight: Math.round(Math.min(rect.top - offsetY * 2, 500)) + 'px'
    }
  } else {
    const rectBottom = rect.top + rect.height
    return {
      left: rect.left + 'px',
      top: Math.round(rectBottom + offsetY) + 'px',
      maxHeight: Math.round(Math.min(window.innerHeight - rectBottom, 500)) + 'px'
    }
  }
}

function createLoader (position = {}) {
  const loader = document.createElement('div')
  loader.innerHTML = '<span>Loading...</span>'

  style(loader, extend({
    position: 'fixed',
    width: '100px',
    height: '100px'
  }, position))

  return loader
}

function createImagePreview ({ url, boxStyle }) {
  const img = document.createElement('img')
  img.src = url

  style(img, extend({
    display: 'inline-block',
    position: 'fixed',
    zIndex: 1000000,
    maxWidth: '500px',
    boxShadow: '0 0 8px rgba(0,0,0,.6)'
  }, boxStyle))

  return img
}

delegate(document.body, 'a', 'mouseover', (event) => {
  const element = event.target
  const href = element.getAttribute('href')
  const isGyazoUrl = !!gyazoIdFromUrl(href)

  if (isGyazoUrl) {
    let container

    const loader = createLoader(adjacentStyle(element))
    document.body.appendChild(loader)

    let leaved = false

    const onLeave = (event) => {
      leaved = true

      if (element !== event.target) return
      if (!container) return
      document.body.removeChild(container)

      element.removeEventListener('mouseleave', onLeave)
    }

    element.addEventListener('mouseleave', onLeave)

    fetchImage(href, (e, blob) => {
      document.body.removeChild(loader)
      if (leaved) return

      container = createImagePreview({
        url: window.URL.createObjectURL(blob),
        boxStyle: adjacentStyle(element)
      })

      document.body.appendChild(container)
    })
  }
})
