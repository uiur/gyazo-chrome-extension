const gyazoIdFromUrl = function (str) {
  let parsedUrl = ''
  try {
    parsedUrl = new URL(str)
  } catch (e) {
    return
  }

  if ((/^(.+\.)?gyazo\.com$/).test(parsedUrl.host) && (/^\/[0-9a-f]+$/).test(parsedUrl.pathname)) {
    return parsedUrl.pathname.slice(1)
  }
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

const isEnabledHost = function (_url) {
  let parsedUrl = ''
  try {
    parsedUrl = new URL(_url)
  } catch (e) {
    return false
  }
  return parsedUrl.host.match(/^github\.com$/) ||
    parsedUrl.host.match(/^(.+\.)?.zendesk\.com$/) ||
    parsedUrl.host.match(/chatwork\.com$/)
}

if (isEnabledHost(location.href)) {
  onNewElement((el) => {
    const href = el.getAttribute('href')

    const isGyazoUrl = !!gyazoIdFromUrl(href)
    const hasChildren = el.children.length > 0
    if (isGyazoUrl && !hasChildren) {
      chrome.runtime.sendMessage(chrome.runtime.id, {
        action: 'gyazoGetOembed',
        gyazoUrl: href
      }, (response) => {
        const xhr = new XMLHttpRequest()
        xhr.open('GET', response.imageBlobUrl, true)
        xhr.responseType = 'arraybuffer'
        xhr.onload = () => {
          const blob = new Blob([xhr.response], {type: "image/png"})
          el.insertAdjacentHTML('afterend',
          `<p>
            <a href=${ href } target="_blank" data-gyazo-id="checked">
              <img src=${ URL.createObjectURL(blob) } style="max-width: 100%;" />
            </a>
          </p>`)
        }
        xhr.send()
      })
    }
  })
}
