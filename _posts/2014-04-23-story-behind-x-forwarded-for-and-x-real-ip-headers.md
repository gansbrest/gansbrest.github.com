---
layout: post
title: "Story behind X-Forwarded-For and X-Real-IP headers"
description: ""
category: infrastructure
tags: [header, nginx, aws]
popular: true
---
{% include JB/setup %}

> This was suppose to be 10 minutes fix.. 

Or so I thought. If you read my blog you probably know that for the most part I'm doing operations stuff for [FastCompany](http://www.fastcompany.com). That means sometimes I deal with little tricky problems like the one I'm going to talk about today.

### CDN, HEADERS and IPs

After recent switch to a new CDN provider, we discovered wrong Client IP address in our Nginx access logs. I started debugging process by taking sample of the headers with **tcpdump** ( quite useful for this sort of stuff! ) on one of the of the Nginx router boxes.

        sudo tcpdump -A -vvvv -s 9999 -i eth0 port 80 > /tmp/sample

Here is part of packet:

        X-Geo: US
        X-Real-IP: 54.83.132.159
        X-Timer: S1398278909.637000322,VS0,VS3
        X-Varnish: 58497648
        X-Varnish: 506864951
        X-Varnish: 2932897992
        X-Varnish: 1531049198
        X-Forwarded-For: 54.83.132.159, 199.27.72.25, 50.19.19.94
        X-Forwarded-Port: 80
        X-Forwarded-Proto: http

I would like us to focus on two headers from this sample **X-Real-IP** and **X-Forwarded-For**. It turns out our CDN provider was passing Client-IP in both of them, but in our Nginx access logs we saw 50.19.19.94 (last IP of the X-Forwarded-For). 

Turns out there is not much information or specifications about those X- headers, but I found out that:

* **X-Forwarded-For** is usually used by proxies to carry original Client IP through intermediary hops. Otherwords each time request goes through proxy, it should add **current request IP** to the list. More details [here](http://en.wikipedia.org/wiki/X-Forwarded-For). The format should look like this pretty much:

        X-Forwarded-For: client, proxy1, proxy2

    There is one problem though (as with many standards implementations) it's not mandatory to use, meaning some proxies will add the header and some will not.. And it's quite easy to spoof as well. Let say you want to hide your real IP - to do that you can just send a request with `X-Forwarded-For: spoof` and proxy will gladly add request IP to the list. The result will look like this `X-Forwarded-For: spoof realip`. As you can see, you can't just extract leftmost IP, because it might be forged (you also need to keep that in mind if you are using that X-Forwarded-For in the application for some kind of IP based logic).

* **X-Real-IP** to be honest, I didn't find any good info or specs about this one.. Looking through numerous blog posts about passing true Client IP to the backend it seem like it's common to set both X-Real-IP and X-Forwarded-For. Anyways if you know more about the history of this header, you are more than welcomed to do it in the comments section below.

### Nginx time to shine

At this point we have both X-Forwarded-For and X-Real-IP in the request headers (and both contain precious Client-IP, well to be honest, you cant 100% say what's **real** client IP, because packets travel through many proxies between client and us. I guess that's another story) but Nginx uses current request IP.

To change that behaviour we need to use Nginx [real_ip module](http://nginx.org/en/docs/http/ngx_http_realip_module.html) (I don't think it's compiled by default). The module exposes couple control knobs which we can use to alter client IP.

If you look at the documentation of the module, you will notice that by default Nginx will use X-Real-IP header (`real_ip_header`) if it's present in the request. Since we have Client IP set by CDN to be X-Real-IP, there is no need to do anything else and we should see correct IP in the logs after enabling the module.

There are couple other important things though: `set_real_ip_from` (set addresses allowed to influence client IP change) and `real_ip_recursive`.

Lets talk about second one. Since Nginx (whith real_ip module) provides a way to extract client IP from X-Forwarded-For it's common to see `real_ip_header` set to X-Forwarded-For, but if you won't enable `real_ip_recursive`, you will get rightmost IP inetead of lefmost.. Here is super useful [ServerFault post](http://serverfault.com/questions/314574/nginx-real-ip-header-and-x-forwarded-for-seems-wrong/414166#414166) describing the problem and solution.

If you are lazy to read, I'll summarize - in order to protect yourself from IP spoof, and get **REAL CLIENT IP** (Morpheus: How do you define 'real'?) you need to enable `real_ip_recursive` and set known proxies using `set_real_ip_from`. Nginx will remove IPs matching known proxies and then use rightmost IP which should be the IP you are looking for!
