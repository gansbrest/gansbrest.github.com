---
layout: post
title: "Dealing with multiple config sets in Solr(+cloud)"
description: ""
category: howto
tags: [solr]
---
{% include JB/setup %}

### Solr in "cloud" mode (solrcloud)

One of the first steps for solrcloud cluster setup is **collection configuration preparation**. Usually it's done like this:

    -Dbootstrap_confdir=./solr/collection1/conf -Dcollection.configName=myconf

If you start Solr with above attributes, it will load configuration files under `./solr/collection1/conf` to Zookeeper with `myconf` name. 

We need to execute this command only once. After configuration was uploaded we can just add more Solr instances without specifying configuration options. It works because if we have ***just one config set*** (`myconf` in our example) in Zookeeper ***it will be automatically linked with all new collections*** we create.

What happens if we upload another config set with the new name?

    zkcli.sh -zkhost localhost:9983 -cmd upconfig -confdir /opt/solr/collection2/conf -confname myconf1

or

    -Dbootstrap_confdir=./solr/collection2/conf -Dcollection.configName=myconf1
    

If we use Solr in "cloud" mode, then we would have to use `linkconfig` command to link collection with its configuration, otherwise Solr won't be happy:

    zkcli.sh -zkhost localhost:9983 -cmd linkconfig -collection collection2 -confname myconf2


**Note** - you can use `linkconfig` action to link config and collection even before collection creation. That could be quite handy.

### Traditional Solr (non-cloud)

It's clear that sharing configuration between collections is very useful feature, but what if you are not in the "cloud" mode? Well, Solr 4.8+ added **Config Sets** specifically for this reason!

If we want to share configuration between cores, we need to place it into `configsets` directory:

    mkdir -p solr/configsets/generic/conf/
    cp -r solr/collection1/conf/* solr/configsets/generic/conf/

Then create couple new cores that would use our config set (note **configSet** attribute in the url):
    
    curl 'http://localhost:8983/solr/admin/cores?action=CREATE&name=products&configSet=generic'
    curl 'http://localhost:8983/solr/admin/cores?action=CREATE&name=tags&configSet=generic'

At this point both cores should be created and point to same config set! You should be able to remove one of the cores without affecting the configuration, since it is stored in different (shared) location.

You can also use `configSet` inside of core.properties file under your core dir:

    name=products
    configSet=generic
  

