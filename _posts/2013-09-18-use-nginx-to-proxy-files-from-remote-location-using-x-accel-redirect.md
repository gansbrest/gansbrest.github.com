---
layout: post
title: "Use Nginx to proxy files from remote location using X-Accel-Redirect"
description: ""
category: infrastructure
tags: [nginx]
---
{% include JB/setup %}

Nginx supports X-Accel-Redirect for local files with no extra hassle, but what happens if you need to serve files located in some remote location like s3 and you don't want to expose direct urls to the files? Sometimes you may want that to have control over stats or to keep an option to migrate to another file server without changing original urls.

Here is what you do:

{% gist 6612699 %}

Then in your application you need to set X-Accel-Redirect header with remote file hostname ( first part ) and URI (second part).

    X-Accel-Redirect: /internal_redirect/assets.example.com.s3-website-us-east-1.amazonaws.com/file/uri.jpg

Potentially you could use the same idea for private files stored on S3. For that you would need to generate correct `Authorization` header

    proxy_set_header Authorization "value";

which might be a little tricky, but possbile with perl support ( extract required tokens from instance metadata if you are using IAM roles, or use access keys passed to the instance somehow ).
