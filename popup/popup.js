(function() {
  var captureBtn = document.getElementById('capture');
  captureBtn.appendChild(document.createTextNode(chrome.i18n.getMessage("contextMenuSelect")));
  var wholeBtn = document.getElementById('whole');
  wholeBtn.appendChild(document.createTextNode(chrome.i18n.getMessage("contextMenuWhole")));

  captureBtn.addEventListener('click', function() {
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
      chrome.runtime.sendMessage(chrome.runtime.id, {
        tab: tabs[0],
        action: 'gyazoCapture'
      }, function(mes){});
      window.close();
    });
  });
  wholeBtn.addEventListener('click', function() {
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
      chrome.runtime.sendMessage(chrome.runtime.id, {
        tab: tabs[0],
        action: 'gyazoWholeCaptureFromPopup'
      }, function(){});
      window.close();
    });
  });
})()
