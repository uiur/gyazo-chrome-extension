var host = "https://upload.gyazo.com/api/upload/easy_auth";
var client_id = "df9edab530e84b4c56f9fcfa209aff1131c7d358a91d85cc20b9229e515d67dd";

function onClickHandler(info, tab) {

  if (info.menuItemId == "gyazo_image") {
    $.ajax({
      type: 'POST',
      url:  host,
      data: {
        client_id: client_id,
        url: info.srcUrl,
        title: tab.title,
        referer: tab.url
      },
      crossDomain: true,
      success: function(data) {
        chrome.tabs.create({url:data.get_image_url, selected:false}, function(newTab){
          var handler = function (tabId, changeInfo) {
            if (newTab.id == tabId && changeInfo.url) {
              saveToClipboard(changeInfo.url);
              chrome.tabs.onUpdated.removeListener(handler);
            }
          };
          chrome.tabs.onUpdated.addListener(handler);
        });
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) {
        window.alert("Status: " + XMLHttpRequest.status + "\n Error: " + textStatus + "\n Message: " + errorThrown.message);
      }
    });
  }
}

chrome.contextMenus.onClicked.addListener(onClickHandler);

chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.create({
    "title": "Gyazo It",
    "id": "gyazo_image",
    "contexts": ["image"]
  });
});

function tabUpdateListener(tabId, changeInfo, tab){
  saveToClipboard(changeInfo.url);
}

function saveToClipboard(str) {
    var textArea = document.createElement("textarea");
    textArea.style.cssText = "position:absolute;left:-100%";

    document.body.appendChild(textArea);

    textArea.value = str;
    textArea.select();
    document.execCommand("copy");

    document.body.removeChild(textArea);
}
