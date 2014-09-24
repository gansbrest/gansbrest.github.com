---
layout: post
title: "Docker VM shortcomings and how Hodor can help"
description: ""
visible: 0
category: infrastructure 
tags: [docker, vm, hodor]
---
{% include JB/setup %}

Finally Docker hype reached FastCompany and here I am adding to it : ) I wish I started with Docker intro post first, but I bet there are tons of stuff like this already on the nets. Instead I'll assume most readers will already be familiar with Docker in some way.

My Docker jorney started couple month ago, when our CTO came to me and said something like: 

"*Hey Sergey, I've heard there is this tool called Docker. It does many neat things, why don't we try it out?*"

"*Try it out for what? We already have chef and everything seems to be working fine.*" ( that's me )

"*I don't know, you'll figure it out*" he said.

Honestly, I could let it pass, but somewhere deep inside I was eager to get some hands-on experience with Docker. I've heard a lot of great stuff about it by then. Plus we all know progress never stops, right?

As first experiment I decided to improve our development / build process. There were many complains about complex dev environment setup every new / existing develover had to go through, install particular version of node, gems and stuff.

I spent about a week to get Docker basics and created copule containers to run our site. At that point everything was going great, I felt like Docker was the way to go. That was until I decied to try my new shiny workflow on Mac ( most of our devs are on Macs ). But docker works everywhere right? Linux, Mac, Windows! "You just need tiny VM to make it work on Mac and Windows".. Sighhh..

#### Dark side

One of the first things I realized running Docker on Mac was problem with volumes sharing. As part of our normal dev workflow we got used to running `nodemon` locally. Any change to codebase triggers node restart. Nice and fast.

I was able to recreate similar environment with Docker on Linux, where we would run nodemon in the container and codebase would be shared using Docker volumes. On Mac however you need to run Docker thrugh VM, meaning that volumes no longer work.

On [Boot2docker](https://github.com/boot2docker/boot2docker) page you can see two approaches recommended for Folders sharing - Samba and VirtualBox Guest Additions ( bundled with recent versions for Boot2Docker). I tested both appraches ( actually I tested nfs and fuse as well ) - all turned out to be very slow for our project with lots (around 17K) of small files. Samba is especially inconvinient because you need to do manual steps to connect to the server. Pain.

Another issue with VM is Port redirection. If you hacked your hosts file to point your development domains to localhost ( 127.0.0.1 fastcompany.local ), that no longer works because by default you need to access your container's ports through VM ip `$(boot2docker ip 2>/dev/null)`. I bet you don't want to update your hosts every time VM's ip changes.

My initial goal was to create same Docker process for people who use Linux and Mac (and yes Windows - eventually :)). I tried Vagrant which at first seemed like what I needed, but once I used it for a bit it felt like I lost a lot of Docker flexibility. Here is the good [topic](http://stackoverflow.com/questions/16647069/should-i-use-vagrant-or-docker-io-for-creating-an-isolated-environment) with more detailed Docker with Vagrant discussions. Besides it was slow and didn't provide all the stuff I wanted ( like ssh-agent forwarding to containers ).

There must be a better way.. ?

#### Bright side

Hodor Hodor Hodor!

I didn't find any existing tool that gave me what I needed, so I decided to write my own. I called it [Hodor](https://github.com/gansbrest/hodor). Why Hodor? Two things: first - my colleague said it's sounds like a bad word in Spanish ( and I was pretty stressed out creating the tool at the time ), second - it's a character from the great book Game of Thrones.
