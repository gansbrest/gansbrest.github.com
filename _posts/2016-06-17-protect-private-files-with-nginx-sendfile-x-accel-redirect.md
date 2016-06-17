---
layout: post
title: "Protect private files with Nginx Sendfile (X-Accel-Redirect)"
description: ""
category: 
tags: [nginx]
---
{% include JB/setup %}

<div style="text-align:center" markdown="1">
![Nginx Sendfile protection](/assets/posts/nginx_sendfile.jpg "Protect your files with Nginx")
</div>

If you are running some kind of e-commerce store, it's quite possible that your product images are protected with watermark. At the same time original uploaded images are not available for public access.  

All nice and good! But what if some of your partners request access to original images without watermarks?

You can't just create new url ( something like `/images/partner_hidden_1234/i/image.jpg` ) and give it to the partner, as it can potentially (and most likely will) leak out. 

The other downside is you have no "metering", meaning you have no idea who access those new urls and how often. Some people may say you have access logs and you may parse those to create stats. Well, yes - you can get some info this way, but only some..

Is there better way? You bet.

#### Meet Nginx X-Accel-Redirect

The idea here is pretty simple. Here is [official doc](https://www.nginx.com/resources/wiki/start/topics/examples/x-accel/) as well.

* First we need to define new url for those original images without watermarks. Let say it will look like this:

    `/original_imgs/awesome_pic.jpg` (note that your actual images may be stored in totally different location on your server, or could even be served from remote locations like S3. This is purely virtual path.)

* Then we generate keys for every partner that require access to images. You partners will need to provide key in two ways, through GET param or direct embed into URI (you can think of more ways if you want, header etc):

    `/original_imgs/awesome_pic.jpg?key=ab234ab` or `/original_imgs/ab234ab/awesome_pic.jpg` 

* Next in Nginx we create new location block, where we rewrite urls to `/original_imgs` to some back end script:


    ```
    location ~ /original_imgs/ {
      rewrite /original_imgs/(.+) /scripts/meter.php?params=$1;
    }
    ```

* Inside of our `meter.php` script we check if the key is correct, store access info (in Redis for example), throw statsd (or Datadog) metric and if everything looks good - return X-Accel-Redirect header with original image location.

    Here is some pseudocode:

    ```php
    // Check the key

    // Store access info

    // Return X-Accel-Redirect with path to the original image

    header('Content-type: image/jpeg');
    header("X-Accel-Redirect: /unprotected_originals/awesome_pic.jpg");
    ```

    Please note that Content-type header might be necessary, otherwise Nginx may guess your Content-type incorrectly. The other option is to remove Content-type from response headers and leave it to Nginx to decide.


* Final step is to create internal location in nginx that will be serving protected files ( `/unprotected_originals` in our example ) to the clients.

    ```
    location ~ /unprotected_originals {
      internal;
    }
    ```

    It's important to note here, that this example is super simple. In reality `/unprotected_originals` location may use aliases or event point to another server/service.

    The main point here is that when someone tries to access `/unprotected_originals` directly, they will get 404 error from Nginx because our location is internal.


#### Conclusion

At this point our original files should be protected from unauthorized access and we have full control and visibility over access patterns, which is VERY important.

If you have some big files, you can apply Sendfile approach to offload file serving to Nginx, which is optimized for the task and release backend resources. Another idea is to provide some temp urls for paid downloads.

As always let me know if you have any questions/suggestions in the comments section below!
