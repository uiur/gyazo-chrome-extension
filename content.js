(function() {

if ((/github\.com/).test(location.hostname)) {
  $(function() {
    // githubに貼り付けるURLを置き換えるやつ
    $(document).on('paste', '.comment-form-textarea', function(event){
      var self = this
      var element = $(this)

      var input = event.originalEvent.clipboardData.getData('text/plain');

      var url = null;

      try {
        url = new URL(input);
      } catch(e) {
        console.log(e);
        return;
      }

      if (! (/gyazo\.com\/[a-f0-9]+\/?$/).test(url.href)) {
        return
      }

      var id = url.pathname.slice(1)

      var url = 'https://i.gyazo.com/' + id + '.png'
      var permalinkUrl = 'http://gyazo.com/' + id

      var markdown = '[![Gyazo](' + url + ')](' + permalinkUrl + ')'

      event.preventDefault()

      var replace = function (text) {
        var val = element.val()
        var text = val.substr(0, self.selectionStart) + text + val.substr(self.selectionEnd, val.length);
        element.val(text)
      }

      replace(markdown)
    });
  })
}
if(/gyazo\.com/.test(location.hostname)){
  document.documentElement.setAttribute("data-extension-installed", true);
}

function changeFixedElementToAbsolute(){
  Array.prototype.slice.apply(document.querySelectorAll('*')).filter(function(item){
    return (window.getComputedStyle(item).position === 'fixed')
  }).forEach(function(item){
    item.classList.add('gyazo-whole-capture-onetime-absolute');
      item.style.position = 'absolute';
  });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  var actions = {
    gyazoCapture: function() {
      var startX, startY, data = {};
      var tempUserSelect = document.body.style.webkitUserSelect;
      var layer = document.createElement('div');
      layer.style.position = 'fixed';
      layer.style.left = document.body.clientLeft + 'px';
      layer.style.top = document.body.clientTop + 'px';
      layer.style.width = document.body.clientWidth + 'px';
      layer.style.height = document.body.clientHeight + 'px';
      layer.style.zIndex = 2147483647; //Maximun number of 32bit Int
      layer.style.cursor = 'crosshair';
      document.body.style.webkitUserSelect = 'none';
      var selectionElm = document.createElement('div');
      layer.appendChild(selectionElm);
      document.body.appendChild(layer);
      selectionElm.styleUpdate = function(styles) {
        Object.keys(styles).forEach(function(key) {
          selectionElm.style[key] = styles[key];
        });
      };
      selectionElm.styleUpdate({
        background: 'rgba(92, 92, 92, 0.3)',
        position: 'fixed'
      });
      var cancelGyazo = function(){
        document.body.removeChild(layer);
        document.body.style.webkitUserSelect = tempUserSelect;
        document.removeEventListener('keydown', keydownHandler);
        window.removeEventListener('contextmenu', cancelGyazo);
      }
      var keydownHandler = function(e){
        // If press Esc Key, cancel it
        if(e.keyCode === 27){
          cancelGyazo();
        }
      };
      var mousedownHandler = function(e) {
        startX = e.clientX;
        startY = e.clientY;
        selectionElm.styleUpdate({
          border: '1px solid rgba(255, 255, 255, 0.8)',
          left: startX + 'px',
          top: startY + 'px'
        });
        layer.removeEventListener('mousedown', mousedownHandler);
        layer.addEventListener('mousemove', mousemoveHandler);
        layer.addEventListener('mouseup', mouseupHandler);
      };
      var mousemoveHandler = function(e) {
        selectionElm.styleUpdate({
          width: (Math.abs(e.clientX - startX) - 1) + 'px',
          height: (Math.abs(e.clientY - startY) - 1) + 'px',
          left: Math.min(e.clientX, startX) + 'px',
          top: Math.min(e.clientY, startY) + 'px'
        });
      };
      var mouseupHandler = function(e) {
        document.body.style.webkitUserSelect = tempUserSelect;
        document.removeEventListener('keydown', keydownHandler);
        window.addEventListener('contextmenu', function(event){
          cancelGyazo();
          event.preventDefault();
        });
        var zoom = Math.round(window.outerWidth / window.innerWidth * 100) / 100;
        var scale = window.devicePixelRatio / zoom;
        data.w = Math.abs(e.clientX - startX);
        data.h = Math.abs(e.clientY - startY);
        if(data.h < 1 || data.w < 1){
          document.body.removeChild(layer);
          return false;
        }
        data.x = Math.min(e.clientX, startX);
        data.y = Math.min(e.clientY, startY);
        data.t = document.title;
        data.u = location.href;
        data.s = scale;
        data.z = zoom;
        document.body.removeChild(layer);
        //wait for rewrite by removeChild
        window.setTimeout(function() {
          chrome.runtime.sendMessage(chrome.runtime.id,{
            action: 'gyazoCaptureSize',
            data: data
          }, function(){});
        },100);
      };
      layer.addEventListener('mousedown', mousedownHandler);
      document.addEventListener('keydown', keydownHandler);
      window.addEventListener('contextmenu', cancelGyazo);
    },
    wholeCaptureInit: function() {
      var context = request.context;
      context.scrollY = window.scrollY;
      context.overflow = document.documentElement.style.overflow;
      context.overflowY = document.documentElement.style.overflowY;
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.overflowY = 'hidden';
      //I want some fixed element not to follow scrolling
      changeFixedElementToAbsolute();
      window.scroll(0, 0);
      var zoom = Math.round(window.outerWidth / window.innerWidth * 100) / 100;
      var data = {
        width: window.outerWidth,
        height: Math.max(document.body.clientHeight, document.body.offsetHeight, document.body.scrollHeight),
        windowInnerHeight: window.innerHeight,
        title: document.title,
        url: location.href,
        captureTop: 0,
        captureButtom: window.innerHeight * zoom,
        scrollPositionY: 0,
        scale: window.devicePixelRatio / zoom,
        zoom: zoom
      };
      //waiting for repaint after scroll
      window.setTimeout(function(){
        chrome.runtime.sendMessage(chrome.runtime.id,{
          action: 'wholeCaptureManager',
          data: data,
          context: context
        });
      }, 50);
    },
    scrollNextPage: function(){
      var data = request.data;
      var captureTop = data.captureButtom;
      var captureButtom = captureTop + data.windowInnerHeight * data.zoom;
      var scrollPositionY = data.scrollPositionY + data.windowInnerHeight;
      window.scroll(0, scrollPositionY);
      data.captureTop = captureTop;
      data.captureButtom = captureButtom;
      data.scrollPositionY = scrollPositionY;
      //I want some fixed element not to follow scrolling
      window.setTimeout(function(){
        changeFixedElementToAbsolute();
        window.setTimeout(function(){
          chrome.runtime.sendMessage(chrome.runtime.id,{
            action: 'wholeCaptureManager',
            canvasData: request.canvasData,
            data: data,
            context: request.context
          });
        },0);
      }, 50);
    },
    wholeCaptureFinish: function(){
      document.documentElement.style.overflow = request.context.overflow;
      document.documentElement.style.overflowY = request.context.overflowY;
      var fixedElms = document.getElementsByClassName('gyazo-whole-capture-onetime-absolute');
      Array.prototype.slice.apply(fixedElms).forEach(function(item){
        item.classList.remove('gyazo-whole-capture-onetime-absolute');
        item.style.position = 'fixed';
      })
      window.scroll(0, request.context.scrollY);
    }
  };
  if(request.action in actions){
    actions[request.action]();
  }
});
})()
