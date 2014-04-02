---
layout: post
title: "SolrCloud in EC2. Dealing with changing IPs"
description: ""
category: infrastructure
tags: [ec2, solrcloud, zookeeper]
---
{% include JB/setup %}

If you use Amazon EC2 service for a while, you probably aware of the fact that any time you stop/start (reboot) your instance the underlying IP might change. We need to account for that when designing new services in EC2.

Lets see what happens to SolrCloud after IP change:

![SolrCloud](/assets/posts/solrcloud.png "SolrCloud after IP change")

Note those grayed out IPs. Those are original ones that changed after instance reboot (or crash). There is no harm in keeping old instances (IPs) in the list, but I like to keep my systems clean and real, so I'll show you the way to remove those from Zookeeper.

**Note: The instructions are for Solr 4.7**

1. First we need to download clusterstate.json from Zookeeper ( as you probably already guessed by name, the file stores list of the instances representing our cluster ):

    `/solr/scripts/cloud-scripts/zkcli.sh -zkhost prod-zookeeper-01.int.****.net:2181 -cmd get /clusterstate.json > /tmp/clusterstate.json`

2. Next we edit the file and remove node sections matching our orphans IPs.

3. Clear existing clusterstate.json file from Zookeeper, so we could upload new one:

    `/solr/scripts/cloud-scripts/zkcli.sh -zkhost prod-zookeeper-01.int.****:2181 -cmd clear /clusterstate.json`

4. Upload modified version:

    `/solr/scripts/cloud-scripts/ -zkhost prod-zookeeper-01.int.****:2181 -cmd putfile /clusterstate.json /tmp/clusterstate.json`

Done! At this point your SolrCloud instances list should be clean again.
