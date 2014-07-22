---
layout: post
title: "Little trick to get AWS instance_id as variable in Nginx"
description: ""
category: 
tags: [aws, nginx]
---
{% include JB/setup %}

If you are running in AWS environment it might be useful to get Amazon instance_id in Nginx for different purposes (logging, headers etc).

To do that we need to compile Nginx with Perl support (`--with-http_perl_module` flag during compilation). After that is done we can put this snippet inside of our `httpd` Nginx config section:

{% gist gansbrest/ecf6bf75fd75aa944887 %}

**Important:** While the Perl module is performing a long-running operation, such as resolving a domain name, connecting to another server, or querying a database, other requests assigned to the current worker process will not be processed. It is thus recommended to perform only such operations that have predictable and short execution time, such as accessing the local file system. That's why we added simple caching.

Reload Nginx and now you should have `$instance_id` variable set.

You can use it in access log:

    log_format main '$msec\t$remote_addr\t$remote_user\t$time_iso8601\t$request\t$status\t$body_bytes_sent\t"$http_referer"\t"$http_user_agent"\t$geoip_country_code\t$request_time\t"$http_x_forwarded_for"\t$http_host\t$instance_id';

Or set custom header to simplify debugging:

    add_header x-by "$instance_id";

Your feedback is always welcomed!

