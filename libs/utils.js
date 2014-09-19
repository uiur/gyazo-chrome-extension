function imageLoader(imgSrc ,callback){
  var img = new Image();
  img.onload = function(){
    callback(img);
  }
  img.src = imgSrc;
}

function saveToClipboard(str) {
    var textArea = document.createElement('textarea');
    textArea.style.cssText = 'position:absolute;left:-100%';

    document.body.appendChild(textArea);

    textArea.value = str;
    textArea.select();
    document.execCommand('copy');

    document.body.removeChild(textArea);
}


var canvasUtils = {
  appendImageToCanvas: function(canvasData, imageSrc, height, width, top, callback) {
    // If 1st argument is Object (maybe <canvas>), convert to dataURL.
    if(typeof canvasData === 'object'){
      canvasData = canvasData.toDataURL();
    }
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    imageLoader(canvasData, function(img) {
      ctx.drawImage(img, 0, 0);
      imageLoader(imageSrc, function(img) {
        ctx.drawImage(img, 0, top);
        callback(canvas);
      })
    });
  },
  trimImage: function(argObj) {
    var imageData = argObj.imageData;
    var startX = argObj.startX;
    var startY = argObj.startY;
    var width = argObj.width;
    var height = argObj.height;
    var scale = argObj.scale || 1.0;
    var callback = argObj.callback || function(){};
    if(typeof imageData === 'string' && imageData.substr(0,5) === 'data:'){
      imageLoader(imageData, function(img){
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        var originalWidth = width;
        var originalHeight = height;
        if(scale){
          startX *= scale;
          startY *= scale;
          height *= scale;
          width *= scale;
        }
        ctx.drawImage(img, startX, startY, width, height, 0, 0, originalWidth, originalHeight);
        callback(canvas);
      })
    }else if(typeof imageData === 'object'){
      //maybe <canvas>
      this.appendImageToCanvas(document.createElement('canvas'), imageData, height, width, 0, function(canvas){
        var ctx = canvas.getContext('2d');
        var originalWidth = width;
        var originalHeight = height;
        if(scale){
          startX *= scale;
          startY *= scale;
          height *= scale;
          width *= scale;
        }
        imageLoader(canvas.toDataURL('image/png'), function(img){
          ctx.drawImage(img, startX, startY, width, height, 0, 0, originalWidth, originalHeight);
          callback(canvas);
        })
      })
    }
  }
}
