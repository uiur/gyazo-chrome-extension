const delegate = require('delegate')

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

function isEnabledHost (_url) {
  let parsedUrl = ''
  try {
    parsedUrl = new window.URL(_url)
  } catch (e) {
    return false
  }

  const hosts = [
    /^github\.com$/,
    /^(.+\.)?zendesk\.com$/,
    /chatwork\.com$/
  ]

  return hosts.some((host) => host.test(parsedUrl.host))
}

if (isEnabledHost(window.location.href)) {
  delegate(document.body, 'a', 'mouseover', (event) => {
    const element = event.target
    const href = element.getAttribute('href')
    const isGyazoUrl = !!gyazoIdFromUrl(href)

    if (isGyazoUrl) {
      let container
      let leaved = false

      function onLeave (event) {
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

        container.style.position = 'absolute'
        container.style.left = document.body.scrollLeft + rect.left + 'px'
        container.style.top = document.body.scrollTop + rect.top + rect.height + 'px'
        container.style.zIndex = 1000000
        container.style.maxWidth = '500px'
        container.style.boxShadow = '0 0 8px rgba(0,0,0,.6)'

        container.innerHTML = `
          <a href=${ href } target='_blank' data-gyazo-id='checked'>
            <img src=${ window.URL.createObjectURL(blob) } style='max-width: 100%;' />
          </a>
        `

        document.body.appendChild(container)

      })
    }
  })
}
