---
layout: post
title: "Internal redirect to another domain with proxy_pass and Nginx"
description: ""
category: infrastructure
tags: [nginx]
---
{% include JB/setup %}

Let say we have multiple sites a.com b.com and c.com and created some shared resourse (widget) under shared.com. For simplicity just imagine Disqus where you need to embed comments widget (shared resourse) to every site, but don't want to deal with AJAX "[same origin policy](http://en.wikipedia.org/wiki/Same-origin_policy)" problems and Iframes ( actually sometimes Iframes are not so bad and could be used with care, but we are not talking about that ).

Or maybe you just want to go to example.com/awesome-page and see a page from another domain, let say Yahoo.com homepage, but preserving original url ( have no idea why would you do that, but hey.. ). So `example.com/awesome-page --> (internally fetches) --> yahoo.com`

How would you do that with Nginx?

Let's go back to our **a b c .com --> shared.com** . To overcome AJAX same-origin policy problem on each client side we can create special path prefix /comment, then in Nginx config we do something like this:

{% gist 6983561 %}

Now we could request `a.com/comment/api/v1/resource` which internally will be transferred to its own service as **shared.com/api/v1/resource** (notice /comment prefix is gone). 

That way you can create small Nginx API to fetch external resources (omg!). Feel free to improvise!
