---
layout: post
title: "Improve and simplify Solr logging with Nginx proxy"
description: ""
category: infrastructure
tags: [solr, logs]
---
{% include JB/setup %}

In efforts to provide better visibility to all parts of our application framework we decided to collect and send Solr query logs to our logging farm for further analysis and smoke tests. For logging aggregation we use [Logstash](http://logstash.net/) with [Kibana](http://www.elasticsearch.org/overview/kibana/) - great open source alternative to commercial (and very expensive) products like Splunk. I thought I wrote about Logstash in the past, but it seems like I didn't, so making a note for myself to do that in the future. 

### Solr and Logs..

In Solr 4.3 and up we can use log4j for logging (which sits on top of [SLF4J api](http://www.slf4j.org/)). That's good enough, we can use different error levels and configure rotation. The only porblem I found with those logs is that there is no clear indication of an error.  I wanted to quickly tell whether my query was successful or not and also send that flag to Logstash (as a field).

Here is how Solr logs with Info level (very detailed) look like:

    INFO - 2014-06-16 20:23:04.942; org.apache.solr.core.SolrCore; [fc_shard1] webapp=/solr path=/select params={indent=false&start=0&q=type_s:series&wt=json&fq=(supertag_s:undefined)+AND+site_s:fastcocreate.com&rows=100} hits=0 status=0 QTime=2

My initial hope was to use *status* field as that success/error indicator, but it was alwasy 0 for me.. To be honest, I still don't know the purpose of that field, chip in if you know!

My other problem with default Solr logs were stack traces. Every time there is some kind of error, Solr generates that big multiline error message in the log, which you can then parse with some Logstash multiline input filter.. Needless to say it's a pain in the ass..

**Two problems at this point**: no clear indication of success/error and stack traces parsing.

### Nginx to the rescue

Since we interact with Solr over HTTP, it was trivial to add lightweight proxy like Nginx in front of it and use Logstash grok log patterns for Nginx access logs parsing which we already had in place. 

I did just that! Every request to Solr makes an entry in Nginx access log which we then feed to Logstash. Simple as that!

To avoid changing application code and configs, I made Nginx listen on default Solr port 9893 and proxy_pass all request to new Solr port 8555. Very easy.

Nginx config looks something like this:

    server
    {
      listen 8983;

      access_log /media/ephemeral0/log/nginx-scloud-access.log  main;

      # Disable proxy buffering because it was causing problems in the past
      proxy_buffering off;

      location / { 
        proxy_pass http://localhost:8555;
      }
    }

That's about it. Now all logs are going to Logstash and I can see errors codes like 400, 419 and 499 in Kibana. Great! As added bonus we can easily secure our Solr install with Nginx ( probably you can do that with some Java configs too ).

*Side note* - if you decide to log and analyse every Solr query, don't forget to plan for extra load on your logging servers.



