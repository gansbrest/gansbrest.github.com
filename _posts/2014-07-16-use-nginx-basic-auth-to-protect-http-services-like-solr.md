---
layout: post
title: "Use Nginx basic auth to protect HTTP services like Solr"
description: ""
category: howto
tags: [nginx, solr]
---
{% include JB/setup %}

Sometimes it might be useful to add simple permissions layer on top of unprotected HTTP services ( especially if you would like to open those to the public! ). Recently we had to secure our Solrcloud install to be able to provide **read only** access to our FTS index to a partner, so they could develop their custom app using our data but without the option to accidentally (or intentionally) break the index.

I hear some of you saying something like "_You should expose REST API endpoint, with proper access token!_" and well, **you are right**! Unfortunately reality is not perfect and sometimes in order to move forward you need to come up with backup/temp solution.

Here is our backup solution for protecting our Solr install with basic read/write permissions using Nginx magic and Basic Auth:

{% gist gansbrest/47c313446bac206c21d5 %}

I think the idea should be pretty clear, the key is to discover which url you want to protect ( **hint**: analyze access logs with [Logstash](http://logstash.net/) ). It's also a good idea to put your Nginx endpoint behind SSL, especially if it's open to public.

**Note: If condition in Nginx location evaluates to true ( if you don't have write or admin permission for example ), it returns 403 without processing Basic Auth, so you may need to send Basic Auth credentials with the request, or land on / url to authenticate in the browser.**

**Note 2:** The approach described here will most likely require a change to the application, since all requests to Solr will need to include Authorization header.

P.S. If you are going to use Nginx in front of your Solr service, then you may benefit from simplified logging as well. Read [Improve and simplify Solr logging with Nginx proxy](/infrastructure/2014/06/23/nginx-as-solr-proxy-logging/).
