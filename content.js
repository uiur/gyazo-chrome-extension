(function() {
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  var actions = {
    gyazoCapture: function() {
      var startX, startY, data = {};
      var tempUserSelect = document.body.style.webkitUserSelect;
      var layer = document.createElement('div');
      layer.style.position = 'fixed';
      layer.style.left = document.body.clientLeft;
      layer.style.top = document.body.clientTop;
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
        background: 'rgba(0,0,0,0.1)',
        position: 'fixed'
      });
      var keydownHandler = function(e){
        // If press Esc Key, cancel it
        if(e.keyCode === 27){
          document.body.removeChild(layer);
          document.body.style.webkitUserSelect = tempUserSelect;
          document.removeEventListener('keydown', keydownHandler);
        }
      };
      var mousedownHandler = function(e) {
        startX = e.clientX;
        startY = e.clientY;
        selectionElm.styleUpdate({
          left: startX + 'px',
          top: startY + 'px'
        });
        layer.removeEventListener('mousedown', mousedownHandler);
        layer.addEventListener('mousemove', mousemoveHandler);
        layer.addEventListener('mouseup', mouseupHandler);
      };
      var mousemoveHandler = function(e) {
        selectionElm.styleUpdate({
          width: Math.abs(e.clientX - startX) + 'px',
          height: Math.abs(e.clientY - startY) + 'px',
          left: Math.min(e.clientX, startX) + 'px',
          top: Math.min(e.clientY, startY) + 'px'
        });
      };
      var mouseupHandler = function(e) {
        document.body.style.webkitUserSelect = tempUserSelect;
        document.removeEventListener('keydown', keydownHandler);
        data.w = Math.abs(e.clientX - startX);
        data.h = Math.abs(e.clientY - startY);
        data.x = Math.min(e.clientX, startX);
        data.y = Math.min(e.clientY, startY);
        data.t = document.title;
        data.u = location.href;
        data.s = window.devicePixelRatio;
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
    }
  };
  if(request.action in actions){
    actions[request.action]();
  }
});
})()
