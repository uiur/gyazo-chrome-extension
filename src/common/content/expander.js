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

const onNewElement = function (cb) {
  setInterval(() => {
    Array.from(document.querySelectorAll('a')).forEach((el) => {
      if (!el.getAttribute('data-gyazo-id')) {
        el.setAttribute('data-gyazo-id', 'checked')
        cb(el)
      }
    })
  }, 1000)
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
  onNewElement((el) => {
    const href = el.getAttribute('href')

    const isGyazoUrl = !!gyazoIdFromUrl(href)
    const hasChildren = el.children.length > 0
    if (isGyazoUrl && !hasChildren) {
      fetchImage(href, (e, blob) => {
        el.insertAdjacentHTML('afterend',
        `<p>
          <a href=${ href } target='_blank' data-gyazo-id='checked'>
            <img src=${ window.URL.createObjectURL(blob) } style='max-width: 100%;' />
          </a>
        </p>`)
      })
    }
  })
}
