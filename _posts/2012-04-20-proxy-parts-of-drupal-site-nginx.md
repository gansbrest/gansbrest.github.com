---
layout: post
category : infrastructure
title: "Proxy parts of Drupal site with Nginx."
tags : [nginx, drupal]
---

Sometimes it could be quite useful to proxy a section of your site to the different multisite install, running different version of Drupal.

Real world scenario: When you go to www.fastcompany.com/mba (which is sadly still running on Drupal 5 at the time of writing ), you should see 30secondmba.com multisite running on Drupal 6 ( completely isolated install with its own DB ).

The idea is that you can tear your old Drupal 5? apart and eventually switch to the newer version, or maybe you just wish to use new release with some awesome features even when got stuck with old Drupal installation.

The solution to this problem will require couple core patches for bootstrap.inc:

1. [https://gist.github.com/gansbrest/7b8c5138bfcb48d4192e](https://gist.github.com/gansbrest/7b8c5138bfcb48d4192e)

    This patch allows us to set HTTP_HOST_PROXY header in Nginx so Drupal could pick specific folder from /sites (multisite) directory.

    For example /mba section could use settings.php file from sites/d6/.fastcompany.com folder.

2. [https://gist.github.com/gansbrest/586265cdefac9e9674e7](https://gist.github.com/gansbrest/586265cdefac9e9674e7)

    We need this second patch to alter $base_path variable based on HTTP_X_SCRIPT_NAME passed from Nginx, so all internal drupal functions could use our /mba prefix. Keeping the prefix is the number one thing to remember when doing proxy redirects, otherwise you will loose the prefix and will be redirected back to your old Drupal 5 install after form submit operations.

Those two patches should apply to Pressflow 6.23

Below I provide the complete Nginx config, which ties all parts together. I’m not sure if that’s the best way to do it in Nginx, but gets the job done. You can separate this config into its own include (separate include for each proxy site) for better maintainability.

    # Special case for processing index.php, we don't wont to lose

    # proxy site prefix during Drupal form redirects

    location ~ /mba/index\.php {

     try_files "" @mba;

    }

    # Handle other php files

    location ~ /mba/(.+\.php)$ {

     # Remove location prefix before proxy_pass for static php scripts

     rewrite /mba/(.+\.php)$ /$1 break;

     try_files "" @mba;

    }

    # Handle url aliases which suppose to go into php

    location ~ /mba/?[^.]*$ {

     try_files "" @mba_rewrite;

    }

    # Handle imagecache

    location ~ /mba/multisite_files/.*/imagecache {

     try_files "" @mba_rewrite;

    }

    # Handle static assets

    location ~ /mba/(.*)$ {

     alias /release/co2/current/$1;

     error_page 404 = @mba_rewrite;

    }

    location @mba {

     proxy_set_header HOST $http_host;

     proxy_set_header HOST_PROXY 30secondmba.com;

     proxy_set_header X_SCRIPT_NAME /mba/index.php;

     proxy_pass http://co2;

    }

    location @mba_rewrite {

     rewrite ^/mba/?(.*)$ /mba/index.php?q=$1;

    }


This whole approach is a little messy, but was tested by us on production and works pretty good. The best part is that it allows us to use newest Drupal features and provides good codebase separation and maintainability. 
