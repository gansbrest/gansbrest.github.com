---
layout: page
title: 
---

<div class="row-fluid" id="avatar">
  <div class="span3">
    <img src="/assets/imgs/my_avatar.jpg" width="155"/>
  </div>
  <div class="span9">
    <p>My name is <a href="http://www.linkedin.com/in/khaladzinski">Sergey Khaladzinski</a> and I work at <a href="http://www.fastcompany.com">FastCompany</a> where we do some neat stuff with Node, Backbone, some Drupal, Solr and many other components. At the moment I'm overseeing operations. Ocasionally I write a post or two about the process, hope you enjoy it :)</p>
    <p>Feel free to gmail me at gansbrest if you have any questions.</p>
    <p><a href="https://twitter.com/gansbrest" class="twitter-follow-button" data-show-count="false">Follow @gansbrest</a>
       <script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');</script>
    </p>
  </div>
</div>
<div class="row-fluid" id="avatar-separator">
  <div class="span12"><h4>Recent posts</h4></div>
</div>

{% include JB/setup %}

<ul class="posts homepage">
  {% for post in site.posts %}
    <li><a href="{{ BASE_PATH }}{{ post.url }}">{{ post.title }}</a> <span>({{ post.date | date_to_string }})</span></li>
  {% endfor %}
</ul>


{% include themes/twitter/popular.html %}
{% include themes/twitter/books.html %}
