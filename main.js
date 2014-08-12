var host = "https://upload.gyazo.com/api/upload/easy_auth";
var client_id = "df9edab530e84b4c56f9fcfa209aff1131c7d358a91d85cc20b9229e515d67dd";

function onClickHandler(info, tab) {

  if (info.menuItemId == "gyazo_image") {
    var image = new Image();
    var canvas =  document.createElement('canvas');
    var ctx = canvas.getContext("2d");
    image.crossOrigin = "Anonymous";
    const INCREMENT_SIZE = 5;
    var notification = {
      progress: 3,
      limit: 30,
      id: 'gyazo_notification_' + Date.now(),
      newTabId: null,
      progressIncrement: function(){
        this.progress = Math.min(this.progress + INCREMENT_SIZE, this.limit);
      }
    };
    chrome.notifications.create(notification.id,{
      type: "progress",
      title: "Uploading to Gyazo",
      message: "Uploading...",
      progress: notification.progress,
      iconUrl: "icon128.png",
      priority: 2
    },function(){})
    var timer_id = window.setInterval(function(){
      chrome.notifications.update(notification.id,{
        progress: notification.progress
      },function(){});
      notification.progressIncrement();
      if(notification.newTabId){
        chrome.tabs.get(notification.newTabId,function(newTab){
          if(newTab.status === 'complete'){
            chrome.notifications.update(notification.id,{
              title: "Finish Uploading",
              message: "copy gyazo URL to your clipboard",
              progress: 100
            },function(){});
            window.clearInterval(timer_id);
          }
        })
      }
    },500);
    image.onload = function(){
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);
      $.ajax({
        type: 'POST',
        url:  host,
        data: {
          client_id: client_id,
          url: canvas.toDataURL(),
          title: tab.title,
          referer: tab.url
        },
        crossDomain: true,
        success: function(data) {
          chrome.tabs.create({url:data.get_image_url, selected:false}, function(newTab){
            notification.limit = 80;
            notification.newTabId = newTab.id;
            var handler = function (tabId, changeInfo) {
              if (newTab.id == tabId && changeInfo.url) {
                saveToClipboard(changeInfo.url);
                chrome.tabs.onUpdated.removeListener(handler);
                notification.newTabId = tabId;
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
    image.src = info.srcUrl;
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
