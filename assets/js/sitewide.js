$( function() {
  $('.posts.homepage li').hide().filter(':lt(10)').show();
  $('.posts.homepage').after('<span class="show-more">Show more</span> &rarr;');
  $('.show-more').click(function(){
    $('.posts.homepage li').siblings(':hidden').toggle();
  });
});
