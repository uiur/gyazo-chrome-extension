const delegate = require('delegate')
const css = require('dom-css')
const extend = require('xtend')
const gyazoIdFromUrl = require('./lib/gyazoIdFromUrl')
const adjacentStyle = require('./lib/adjacentStyle')

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

const node = document.createElement('style')
node.innerHTML = `
.gz-circle-loader {
  display: inline-block;
  text-indent: -9999em;
  margin: 0;
  border-top: 8px solid rgba(0, 0, 0, .2);
  border-right: 8px solid rgba(0, 0, 0, .2);
  border-bottom: 8px solid rgba(0, 0, 0, .2);
  border-left: 8px solid #000;
  animation: spin 1.1s infinite linear;

  border-radius: 50%;
  width: 32px;
  height: 32px;

  &:after {
    border-radius: 50%;
    width: 32px;
    height: 32px;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
`

document.body.appendChild(node)

function createLoader (position = {}) {
  const loader = document.createElement('div')
  loader.className = 'gz-circle-loader'

  css(loader, extend({
    position: 'fixed'
  }, position))

  return loader
}

function createImagePreview ({ url, boxStyle }) {
  const img = document.createElement('img')
  img.src = url

  css(img, extend({
    display: 'inline-block',
    position: 'fixed',
    zIndex: 1000000,
    maxWidth: 500,
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
