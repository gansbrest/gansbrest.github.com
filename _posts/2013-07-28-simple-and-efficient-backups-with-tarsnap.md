---
layout: post
title: "Simple and efficient backups with Tarsnap"
description: ""
category: "handy tools"
tags: []
---
{% include JB/setup %}

Backups! Everyone knows about backup importance, but because of configuration complexity many just giving up hoping to get away without them..

And then a day, week or year later it bites you in the butt! I know this because I've been there.. couple times actually. No matter which tool you pick, just use something!

### Welome Tarsnap

>  [Tarsnap](http://www.tarsnap.com) is a secure online backup service for BSD, Linux, OS X, Minix, Solaris, Cygwin, and probably many other UNIX-like operating systems. The Tarsnap client code provides a flexible and powerful command-line interface which can be used directly or via shell scripts. 

Basically it's a service that securely stores your information on s3 (the **original version**, which can survive the loss of 2 datacenters, not the "reduced redundancy" version which can only survive the loss of a single datacenter) and it's very cheap to use. At the moment it costs 0.30$/GB-month.

If you ever used tar command before you will know how to use tarsnap, because it provides very similar command line options.

The most interesting part about the service is data de-duping. Before Tarsnap sends data to the storage facility it first tries to identify which of the data is actually new and sends only that! Then you only gets charged for the amount of **unique** data sent and stored on s3. How cool is that!?

Imagine a scenario where you want to do daily backups of images folder with total size of 2Gb. With regular backup tools you would have to archive and store 2Gb each time you do the backup. With Tarsnap you upload 2Gb of data initially and all other backups are just deltas ( probably delta is a wrong word, since each backup is totally independent, so it's no really an increment per se ) containing only new data which usually are much much smaller in size! 

Keep in mind that it's not traditional full-plus-incrementals backup, with Tarsnap you can create and delete archives independently of each other. I know it sounds like Tarsnap ad, but it's not. Try it and see for yourself.

### Tools

You can use tarsnap command line interface without any extra tools. Sometimes though, you want to do some more complex backup setups, where you configure which folders you want to archive, how many copies to store, daily, weekly, monthly backups and so forth. 

For that reason I created simple php script called [Tarsnapit](https://github.com/gansbrest/Tarsnapit). It's a wrapper around tarsnap service, that could be very handy for VPS backups. Actually pretty recently I completely rewrote it to be more abstract. Now it provides many useful things like config file support, plugins with config extending, custom bundles and efficient configurable rotation policies.

It may sound a little complicated, but it's super simple to use. Give it a shot and tell me what you think ( pull requests are always welcomed ).

Stop writing your own custom backup tools and try Tarsnap, you won't regret it!
