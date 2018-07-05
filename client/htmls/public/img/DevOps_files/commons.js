$(function(){
  
  // creating a global namespace
  if(!window.DEVOPS) {
  	window.DEVOPS = {};
  }
  
  var navigation = {};
   
  var $actions = $('.page_nav'); 

  var $next_btn = $actions.find('a[href="#next"]');
  var $prev_btn = $actions.find('a[href="#previous"]');
  var $finish_btn = $actions.find('a[href="#finish"]');
  var $dynamicContent = $('#dynamic_content');
  
  
  var nextBtnClickEvt =null;
  var prevBtnClickEvt =null;
  var finishBtnClickEvt =null;

  // adding events 
  $next_btn.click(function(e){
    if(typeof nextBtnClickEvt === 'function') {
    	nextBtnClickEvt();
    }  
  });
  
  $prev_btn.click(function(e){
  	if(typeof prevBtnClickEvt === 'function') {
    	prevBtnClickEvt();
    }  
  });

  $finish_btn.click(function(e){
  	if(typeof finishBtnClickEvt === 'function') {
    	finishBtnClickEvt();
    } 
  });

  function showBtn($btn) {
     $btn.parent().show();
  }

  function hideBtn($btn) {
  	$btn.parent().hide();
  }


  navigation.setContent = function(content) {
    $dynamicContent.empty().append(content);
  };
  
  navigation.showNextBtn = function(clickEvent) {
     nextBtnClickEvt = clickEvent;
     showBtn($next_btn);
  };
  
  navigation.showPreviousBtn = function(clickEvent) {
     prevBtnClickEvt = clickEvent;
     showBtn($prev_btn);
  };
  
  navigation.showFinishBtn = function(clickEvent) {
     finishBtnClickEvt = clickEvent;
     showBtn($finish_btn);
  };

  navigation.hideAllBtns = function() {
      hideBtn($next_btn);
      hideBtn($prev_btn);
      hideBtn($finish_btn);
  }

  window.DEVOPS.navigation = navigation; 

});