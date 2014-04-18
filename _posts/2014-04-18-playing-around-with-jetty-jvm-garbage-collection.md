---
layout: post
title: "Playing around with Jetty JVM Garbage Collection"
description: ""
category: 
tags: [infrastructure, solr, java]
---
{% include JB/setup %}

First of all, I would never thought I'm going to write about JAVA GC. I'm not a JAVA guy, everything described in this post is my personal experience from the operational stand point. I hope it will be useful for some of you as well.

Quick summary for those who wants quick answers - **Make sure to use Java 1.7u25 (Oracle preferred) if you are running any java app in production.**

Yep, I know it sounds a bit silly, but that actually a very first thing you should try, before starting to play around with GC tunning knobs.. It should solve 90% of Garbage Collection problems for simple use cases.

**Important** - if you are doing indexing of your hosts, then you should use 1.7u25 (not the newer one like you may think). Why? Because of the bug in one of the recent versions of JAVA. That's according to some smart dudes on IRC.. ) Thanks guys! Anyways, maybe that bug is fixed, so try newer versions on your own risk..

For those who still here with me and wants to know more - carry on.

At FastCompany we use Solr extensively, we even use it for both index lookups and data store. We started with one Solr box and it was fine for a while. Occasionally though, we observed strange Solr pauses, which would freeze our apps. After doing some profiling we discovered that those pauses were caused by java garbage collection, right when java process memory was about to cross the allowed limit.

We also discovered that once Solr will go to GC phase, it would never recover (CPU would stuck at 100%), partly because of queries flood from our backend severs ( and retry policy - **you need to be very careful with retries!** ) and partly because of poor GC implementation.

At that moment we were using Amazon AMI with OpenJDK Java 1.6

As our traffic and index grew those problems started to show more often, so we would have to restart Solr process almost every other day.

At some point I've got enough of that and decided to learn a bit about JAVA GC to find a way to make it more reliable.

One of the most important tools I used to observe Java process behaviour was **jconsole**. I had to add couple switches to JVM so I could connect to the process from my local workstation:

    -Djava.rmi.server.hostname=ec2-54-**-158-**.compute-1.amazonaws.com -Dcom.sun.management.jmxremote -Dcom.sun.management.jmxremote.port=9010 -Dcom.sun.management.jmxremote.local.only=false -Dcom.sun.management.jmxremote.authenticate=false -Dcom.sun.management.jmxremote.ssl=false

**One important note for AWS users** - make sure you open all ports for your IP in the security group, because jconsole strangely chooses random port when you connect to it and use it for further communication..

Here is how our jconsole graph looked initially (well, actually we did reduced heap from 4GB to 1GB here, but still use Java 1.6):

![Jconsole](/assets/posts/heap_1gb_30m.png "Jconsole Heap")

Jconsole is very useful to discover current state of the process, but if you need historical data, you should consider [SPM](sematext.com) from Sematext. It's a paid service, but I think it worth it (especially if you running multiple boxes). It was a breeze to install and use.

Here are couple graphs taken from SMP report:

![SMP](/assets/posts/cloud04.png "SMP Pool size")

![SMP](/assets/posts/gc_cloud04_v1.png "SMP GC summary")

While I was working on the problem, I discovered this great [post](http://wiki.apache.org/solr/SolrPerformanceProblems) about Solr Performance tuning. Will quote a line from there:

> You want a heap that's large enough so that you don't have OutOfMemory (OOM) errors and problems with constant garbage collection, but small enough that you're not wasting memory or running into huge garbage collection pauses. 

Turns out Java Heap is divided into multiple spaces: *Eden* ( that's where most of the new objects are created and die ), *Survivor Space* ( where object got moved from Eden when they survive couple collections ) and *OldGen* ( objects survived couple collections in Survivor Space got moved here ).

If that OldGen space get's full, it could trigger STOP-THE-WORLD garbage collection process, which may take a long time to run ( depending on your heap size ). The funny thing is that you can't schedule GC to a specific time, it's all Java's black magic!

Actually you don't need very long pause to kill your app. If you do a lot of queries per second even a slight pause can throw you off balance.. 

Before I started changing java options we had 4GB heap for 1GB index. Because GC in Java 1.6 wasn't working properly and didn't reclaim OldGen space, it would grow to 4GB and would start full GC cycle which would kill our site.

After observing jconsole graph for a bit (and talking to some core contribs on IRC :) ) I discovered that my lows on ther graph were well within 1GB, so I set -xms and -xmx to 1GB instead of 4, to make GC a bit faster, since it needed to do less work.

At [FastCompany](http://www.fastcompany.com) (and CO sites network) we do around 300 queries per second ( you can get that metric either from Solr Admin UI ( choose core --> Plugin Stats --> QueryHandler --> /select or wherever you use ) or SPM Console. Because of it I increased Eden size a little bit (using -XX:NewRatio=1), to minimize collections there.

The graph started looking like a chainsaw ( see above ), those sharp downs are Sweep Collections. If you look more closely though, you'll notice that memory utilization increased over time. I had no idea why Sweep GC would not reclaim OldGen space.. I've tried numerous GC switches I find online and nothing actually worked.. Then I followed multiple advices on IRC and upgraded to **Java 1.7u25**. After that my memory graph stabilized and started looking like this (also SMP graph):

![SMP](/assets/posts/heap_after_java_upgrade.png "SMP HEAP after JAVA upgrade")

GC actually started to reclaim OldGen!

So as I said in the beginning of the post - **you should try to upgrade first and see if it fixes your GC problems**. For us it was the game changer.. Since the upgrade we didn't need to restart Solr any more!

Here are some other switches we use:

    -XX:+UseConcMarkSweepGC -XX:+CMSIncrementalMode -XX:+UseParNewGC -XX:SurvivorRatio=4

Looking back at what I wrote, I'm not sure if there will be any usefulness out of it.. :) It still feels like I just touched the basics and some real Java guys are probably going to laugh at me. But hey, who cares right?
