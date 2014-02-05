---
layout: post
title: "Nginx X-Accel-Redirect with proxy_pass and Host change.."
description: ""
category: infrastructure
tags: [nginx]
---
{% include JB/setup %}

I already wrote about [using Nginx and X-Accel-Redirect](/infrastructure/2013/09/18/use-nginx-to-proxy-files-from-remote-location-using-x-accel-redirect/). But today I would like to get back to it, since recently I've spent a lot of time trying to solve similar problem..

#### The problemo

We have a cdn in front of our sites and multiple pointers to static assets like a.static-example.com b.static-example.com etc. Pretty common thing. We also have our normal sites like www.fastcompany.com, www.fastcodesign.com and so forth. 

One of our developers came to me saying that he needs to load a **csv** file from one of our static domains on the client to read it with jQuery and display a nice chart. Of course you can't just load a file from another hostname (or even a subdomain), because of AJAX [Same-origin policy](http://en.wikipedia.org/wiki/Same-origin_policy).

#### The solution

You probably can solve this situation in multiple ways, for example one could put a file to the website assets dir and serve it from the same domain, or try to utilize [JSONP](http://en.wikipedia.org/wiki/JSONP). We didn't want to do this because we store all our assets on S3, so we decided to create a route with Nginx which internally would fetch file from our static hostname using X-Accel-Redirect.

In simple terms it looks like this: 
`GET to www.fastcompany.com/assets/my.scv ---> (internal Nginx magic) ---> static.fc.com/assets/my.scv`

Now to the magic:

{% gist 8832525 %}

Now it may seem simple on the surface and in some case it will be simple. But in our scenario when **static.fc.com** would receive a request, it would pass it to the application and base on its logic it will return X-Accel-Redirect header with the final location of the asset on s3. Essentially it's a chain of internal redirects.

It's **very important** that you use destination hostaname with resolver in proxy_pass ( not the pointer to the upstream! ). Otherwise Nginx will ignore proxy_set_header and use original Host header for X-Accel-Redirect request. I confirmed that with tcpdump. I know it sounds odd and unnecessary complicated, but just try to stick with example above. 

For some more info you can read my [Nginx ticket](http://trac.nginx.org/nginx/ticket/497) (which was sort of rejected), probably because of my poor problem explanation..
