---
layout: post
title: "Openssl heartbleed autofix for EC2 Amazon AMI - be aware!"
description: ""
category: 
tags: [infrastructure, ec2]
---
{% include JB/setup %}

You probably heard about recent security hole discovered in openssl library called **Heartbleed**. If not read:

[http://heartbleed.com/](http://heartbleed.com/)

[http://www.openssl.org/news/secadv_20140407.txt](http://www.openssl.org/news/secadv_20140407.txt)

Anyways here is the catch - turns out Amazon can roll critical updates to all images based of Amazon AMI! (well, not all to be honest, you can still control that process as you will find out if you read links below, but this feature is **ON by default**)

Here I have couple relevant links describing the process:

[https://aws.amazon.com/amazon-linux-ami/faqs/#auto_update](https://aws.amazon.com/amazon-linux-ami/faqs/#auto_update)

[https://aws.amazon.com/amazon-linux-ami/faqs/#lock](https://aws.amazon.com/amazon-linux-ami/faqs/#lock)

You can also check out Amazon response to Heartbleed related question on one of the forums:

> For the Amazon Linux AMI, we are actively working on updates, and we hope to push them out on Tuesday. We want to make sure that we get the testing right, because the Amazon Linux AMI (by default) applies Critical and Important security updates on initial launch, unless you configure it otherwise.

> This could have an interesting impact on much older Amazon Linux AMIs that are not "locked on launch" to a specific repository version, and we want to carefully test.

Ok, autoupdates sound good and that could (*or should?*) be treated as a GOOD feature. Unfortunately it can break your app if you missed it. Here is how:

Imagine you replaced your CI box which prepares builds and got new openssl library, then new build happens and compiles against new version which you then roll to production boxes ( which you didn't replace ) and your app suddenly stop working.. This is just one example, I'm sure you will find more.

Anyways - the takeaway here is that you need to monitor those **critical** updates. And don't be too puzzled one day if you see something new on your backed AMI like I did with this openssl update :) 
