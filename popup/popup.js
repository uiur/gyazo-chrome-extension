(function() {
  function requestSession(){
    $('.view').css({display: 'none'});
    $('#accessGyazo').css({display: 'block'});
  }
  function closeSelectMode(){
    $('#mode li').removeClass('show');
  }
  function generateText(mode ,url){
    switch(mode){
      case 'url':
        return url;
      case 'md':
        return '!['+url+']('+url+'/raw)';
      case 'html':
        return '<a href="'+url+'"><img src="'+url+'/raw"/></a>'
    }
  }
  if(localStorage.mode){
    var mode = localStorage.mode;
  }else{
    var mode = 'url';
    localStorage.mode = 'url';
  }
  var modeText = $('#mode li[data-mode='+mode+']').addClass('selected').text();
  $('#displayMode').text(modeText);
  $('#displayMode').on('click', function(){
    $('#mode li').addClass('show');
  });
  $('#mode li.selection').on('click',function(){
    $('#mode .selected').removeClass('selected');
    var modeText = $(this).addClass('selected').text();
    $('#displayMode').text(modeText);
    localStorage.mode = $(this).data('mode');
    closeSelectMode();
  });
  var captureBtn = document.getElementById('capture');
  captureBtn.appendChild(document.createTextNode(chrome.i18n.getMessage("contextMenuSelect")));
  var wholeBtn = document.getElementById('whole');
  wholeBtn.appendChild(document.createTextNode(chrome.i18n.getMessage("contextMenuWhole")));
  captureBtn.addEventListener('click', function() {
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'gyazoCapture'}, function(mes){});
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
  $.getJSON('https://gyazo.com/tabs/history/images.json?page=1')
    .done(function(data){
      data.filter(function(elem){
        return !!elem.permalink_url;
      }).forEach(function(item){
        var thumbElm = $('<img>').attr('src', item.thumb_url);
        $('#imageView').append($('<div>').addClass('thumb').append(thumbElm));
        thumbElm.on('click', function(){
          if($(this).is('.selected')){
            $(this).removeClass('selected');
            var mode = localStorage.mode;
            var text = generateText(mode, item.permalink_url);
            var textArea = $('<textarea>').prop('value', text).css({width: '1px'});
            $('body').append(textArea);
            textArea.select();
            document.execCommand('copy');
            $(textArea).remove();
          }else{
            $('img.selected').removeClass('selected');
            $(this).addClass('selected');
          }
        });
      });
    }).fail(requestSession);
})()
