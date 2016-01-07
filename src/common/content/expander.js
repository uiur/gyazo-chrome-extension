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

      container = document.createElement('div')
      const rect = element.getBoundingClientRect()

      let position

      const offsetY = 10
      const centerY = Math.floor(window.innerHeight / 2)
      if (rect.top > centerY) {
        position = {
          bottom: (window.innerHeight - rect.top + offsetY) + 'px'
        }
      } else {
        position = {
          top: rect.top + rect.height + offsetY + 'px'
        }
      }

      style(container, extend({
        position: 'fixed',
        left: document.body.scrollLeft + rect.left + 'px',
        zIndex: 1000000,
        maxWidth: '500px',
        maxHeight: '500px',
        boxShadow: '0 0 8px rgba(0,0,0,.6)'
      }, position))

      container.innerHTML = `
        <a href=${ href } target='_blank'>
          <img src=${ window.URL.createObjectURL(blob) } style='max-width: 100%;' />
        </a>
      `

      document.body.appendChild(container)
    })
  }
})
