(function () {
  'use strict'
  let selector = document.getElementById('selector')
  selector.value = window.localStorage.getItem('behavior') || 'element'
  document.getElementById('element').textContent = chrome.i18n.getMessage('selectElement')
  document.getElementById('area').textContent = chrome.i18n.getMessage('selectArea')

  selector.addEventListener('change', function (event) {
    window.localStorage.setItem('behavior', event.target.value)
    document.querySelector('.alert-message').textContent = 'Saved'
    window.setTimeout(function () {
      document.querySelector('.alert-message').textContent = ''
    }, 2500)
  })
})()
