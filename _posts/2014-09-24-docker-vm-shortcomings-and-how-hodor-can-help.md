---
layout: post
title: "Docker VM shortcomings and how Hodor can help"
description: ""
visible: 1
category: infrastructure 
tags: [docker, vm, hodor]
---
{% include JB/setup %}

<div style="text-align:center" markdown="1">
![Docker bright side](/assets/posts/docker_bright.jpg "Docker bright side")
</div>

#### Bright side

Finally Docker hype reached FastCompany and here I am adding to it : ) I wish I started with Docker intro post first, but I bet there are tons of stuff like this already on the nets. Instead I'll assume most readers will already be familiar with Docker in some way.

My Docker journey started couple months ago, when our CTO came to me and said something like: 

"*Hey Sergey, I've heard there is this tool called Docker. It does many neat things, why don't we try it out?*"

"*Try it out for what? We already have chef and everything seems to be working fine.*" ( that's me )

"*I don't know, you'll figure it out*" he said.

Honestly, I could let it pass, but somewhere deep inside I was eager to get some hands-on experience with Docker. I've heard a lot of great stuff about it by then. Plus we all know progress never stops, right?

For the first experiment I decided to improve our development / build process. There were many complains about complex dev environment setup every new / existing developer had to go through, install particular version of node, gems and stuff. Besides that, our production environment is running on Linux boxes, where devs are mostly on Macs. That forces us to run `npm rebuild` on integration server ( and dev boxes too ) to recompile extensions for particular architecture. With Docker we would one environment for prod and dev, no more recompilations, which is great.

I spent about a week to learn Docker basics and created couple containers to run our site. At that point everything was going great, I felt like Docker was the way to go. That was until I decided to try my new shiny workflow on Mac. I didn't expect anything bad, because "*Docker works everywhere: Linux, Mac, Windows! You just need tiny VM to make it work on Mac and Windows*".. Sighhh..

<div style="text-align:center" markdown="1">
![Docker dark side](/assets/posts/docker_dark.jpg "Docker dark side")
</div>

#### Dark side

One of the first things I realized running Docker on Mac was problem with volumes sharing. As part of our normal dev workflow we got used to running `nodemon` locally. Any change to codebase triggers node restart. Nice and fast.

I was able to recreate similar environment with Docker on Linux, where we would run `nodemon` in the container and codebase would be shared using Docker volumes. On Mac, however, you need to run Docker through VM, meaning that volumes no longer work.

On [Boot2docker](https://github.com/boot2docker/boot2docker) page you can see two approaches recommended for Folders sharing - Samba and VirtualBox Guest Additions ( bundled with recent versions for Boot2Docker). I tested both approaches ( actually I tested nfs and fuse as well ) - all turned out to be very slow for our project with lots (around 17K) of small files. Samba is especially inconvenient because you need to manually click around to connect to the server. Pain.

Another issue with VM is Port redirection. If you hacked your hosts file to point your development domains to localhost ( `127.0.0.1 fastcompany.local` ), that no longer works because by default you need to access your container's ports through VM ip `$(boot2docker ip 2>/dev/null)`. I bet you don't want to update your hosts every time VM's ip changes.

Remember, my main goal was to create same workflow for people who use Linux and Mac (and yes Windows - eventually :)). I tried Vagrant, which at first seemed like what I needed, but eventually it felt like I lost a lot of Docker flexibility using it. Here is the good [topic](http://stackoverflow.com/questions/16647069/should-i-use-vagrant-or-docker-io-for-creating-an-isolated-environment) with more detailed Docker and Vagrant discussions.

That was not the reason I ditched it - Vagrant was too abstract, file sharing was slow and it didn't provide all the stuff I wanted ( like ssh-agent forwarding in the containers ). Also I didn't like the idea of installing sshd on my containers - more info [here](http://jpetazzo.github.io/2014/06/23/docker-ssh-considered-evil/). Maybe it's just me?

There must be a better way..

<div style="text-align:center" markdown="1">
![Meet hodor](/assets/posts/chuck_norris.jpg "Meet hodor")
</div>

#### Hodor

Hodor Hodor Hodor!

I didn't find any existing tool that gave me what I needed, so I decided to write my own. I called it [Hodor](https://github.com/gansbrest/hodor). Why Hodor? Two things: first - my colleague said it's sounds like a bad word in Spanish ( and I was pretty stressed out creating the tool at the time ), second - it's a character from the great book Game of Thrones, a big strong guy that executes orders without asking too many questions.

Currently it's very raw (but usable) and supports Linux and Mac only. 

For current folder sharing on Mac I use combination of [Unison](http://www.cis.upenn.edu/~bcpierce/unison/), which, unlike Rsync, supports reliable two way sync and [Fswatch](https://github.com/emcrisostomo/fswatch) which is used to trigger Unison on file change. This blend works pretty fast and is very lightweight.

For port sharing on Mac I use VirtualBox hacks like `VBoxManage controlvm`.

On Linux everything works natively, no special tricks required, plus you still get the benefit of the same workflow.

Give it a try and let me know what you think. Here is the url again [https://github.com/gansbrest/hodor](https://github.com/gansbrest/hodor).
