$(document).ready(function(){
  $('.export').click(function(e){
    e.preventDefault();
    $('#exportform').show();
  });
  // $('body').on('focusout', '#exportform', function(e){
  //   $('#exportform').hide();
  // });
  $('#exportform form').submit(function(e){
    e.preventDefault();
    var $url = ($(this).attr('action'));
    $.ajax({
      method: "POST",
      url: $url,
      data: $(this).serialize()
    }).done(function() {
      $('#exportform').hide();
    });
  });
});