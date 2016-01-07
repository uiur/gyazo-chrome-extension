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

delegate(document.body, 'a', 'mouseover', (event) => {
  const element = event.target
  const href = element.getAttribute('href')
  const isGyazoUrl = !!gyazoIdFromUrl(href)

  if (isGyazoUrl) {
    let container
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
      if (leaved) return

      container = document.createElement('img')
      const rect = element.getBoundingClientRect()

      const offsetY = 10
      const centerY = Math.floor(window.innerHeight / 2)

      let position
      if (rect.top > centerY) {
        position = {
          bottom: Math.round((window.innerHeight - rect.top + offsetY)) + 'px',
          maxHeight: Math.round(Math.min(rect.top - offsetY * 2, 500)) + 'px'
        }
      } else {
        const rectBottom = rect.top + rect.height
        position = {
          top: Math.round(rectBottom + offsetY) + 'px',
          maxHeight: Math.round(Math.min(window.innerHeight - rectBottom, 500)) + 'px'
        }
      }

      container.src = window.URL.createObjectURL(blob)

      style(container, extend({
        display: 'inline-block',
        position: 'fixed',
        left: document.body.scrollLeft + rect.left + 'px',
        zIndex: 1000000,
        maxWidth: '500px',
        boxShadow: '0 0 8px rgba(0,0,0,.6)'
      }, position))

      document.body.appendChild(container)
    })
  }
})
