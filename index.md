---
layout: page
title: Sergey Khaladzinski (gansbrest) tech blog 
kind: front
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
    <a style="padding-left: 10px; top: -6px; position: relative;" href="https://www.codementor.io/gansbrest?utm_source=github&utm_medium=button&utm_term=gansbrest&utm_campaign=github"><img src="https://cdn.codementor.io/badges/contact_me_github.svg" alt="Contact me on Codementor" style="max-width:100%" /></a>
    </p>
  </div>
</div>
<div class="row-fluid" id="avatar-separator">
  <div class="span12"><h4>Recent posts</h4></div>
</div>

{% include JB/setup %}

<ul class="posts homepage">
  {% for post in site.posts %}
    {% if post.visible != 0  %}
    <li><a href="{{ BASE_PATH }}{{ post.url }}">{{ post.title }}</a> <span>({{ post.date | date_to_string }})</span></li>
    {% endif %}
  {% endfor %}
</ul>


{% include themes/twitter/popular.html %}

<h4>Hosting</h4>

<p>If you are looking for shared hosting and not sure which one to pick, here is nice website with solid and honest <a href="https://www.ncmonline.com">top 10 web hosting</a> list. Actually there is a list of 50! hosters reviewed (including <a href="https://www.ncmonline.com/web-hosting-reviews/a2-hosting">a2 hosting reviews</a>), so I'm sure you will find one that you like.</p>

{% include themes/twitter/books.html %}
