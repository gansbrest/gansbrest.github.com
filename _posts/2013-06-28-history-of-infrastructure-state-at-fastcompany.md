---
layout: post
title: "History of infrastructure state at FastCompany"
description: ""
category: infrastructure 
tags: []
---
{% include JB/setup %}

> Recently I started doing quite a bit of operations stuff at FastCompany, so I decided to write couple articles to illustrate our transition to AWS and later to Chef. There were few bumps on the road, some of you may be able to avoid them by reading these posts .. I hope :)

I joined FastCompay about 4,5 years ago as one of the website developers, at the time the site was rebuilt on the *awesome* Drupal 5 platform ( of course it wasn't so awesome after all ) by some 3rd party contractor company and FC decided to build in house team of programmers to maintain and evolve this beast.. 

It's been a while, so I may forget some details - correct me if I'm wrong about something.

I'm not going to talk too much about coding details here (maybe in some other posts). Main focus of this and following posts will be infrastructure and things around it.. 

### Pre AWS period

When I arrived at FastCompany we had 3 dedicated web servers ( I think? ) and one db server. One of those machines was a pretty powerful box with lots of ram and cpu, but we never utilized it to the fullest. It was hard at times to maintain different configs on those servers, so it's a good advice to use similar (or better same) machines when you manage stuff by hand like we did. 

We were using svn at the time and our deploy process looks like `svn up` on the servers. Since we had 3 of those the process was a bit painful, plus not so robust and error prone.

Another problem for us at the time was soft installs on the servers - everything had to be done by hand and there was no docs or specs anywhere detailing what binaries should be installed on which server. As the result we couldn't really start more similar boxes when we needed those ( traffic spike ). That biffy server with it's own configs added to the problem.

Two years down the road and our contract with hosting company was scheduled to expire. We didn't want to extend it, because we were overpaying them by a lot. Migration was on the horizon.. that added a lot of heavy thoughts to our heads.. And then another event happened - our CTO Paul Maiorana left to work for Wordpress.. Dark times began! )

We were CTO'sless couple month and then Matt Mankins joined us as new CTO. Remember there migration was looming, but fortunately he had experience working with AWS in the past and recommended to try it out. And we did.


### Amazon AWS period

It's been a big mindset change coming from dedicated servers to the cloud. The idea of easily starting machines when you need  and stopping them you don't with one click of the button ( or even in fully automated way with autoscaling ) sounded great but we needed a way to reliably clone servers. Fortunately you can solve this prolbem easily (not without it's own consequences) in AWS by creating server images - AMI's. 

Anyways, there we were - migration under the belt, running in the cloud! I didn't mention one thing about AMI's - those are byte copies, which means it copies everything you have on the box - configs, releases, passwords etc. It's not always ideal to do it this way, since some parts of the machine meant to be dynamic ( releases is just one example ). Usually you have different machines roles, i.e. different services installed on them ( web server, db server, caching server etc ). You have multiple options to support those conditions:

* build different AMIs for each role

* build all binaries into one AMI and use custom bootstrap scripts to start / stop services

* use infrastructure automation framework like chef, puppet to install and configure things for you

In the next article I'll write about our experience with AWS at FastCompany and will go into some details about our bootstrap process. Stay tuned.

_UPDATE:_ [Read next - provision machines with AWS](/infrastructure/2013/07/02/provision-machines-with-aws---custom-bootsrapper/)
