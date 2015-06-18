---
layout: post
title: "Docker + Hodor for simple and reliable dev setup"
description: ""
category: infrastructure
tags: [docker, hodor]
---
{% include JB/setup %}

### Prerequisites

Here is real world scenario: You have this project you are working on, it requires php 5.3 ( yeah, old I know :) ) in fpm mode + xdebug + nginx and maybe something else (database?). You spent couple days configuring all that stuff on your workstation and everything works.. until something happens. Maybe your hardrive dies, maybe you just upgraded OS version and it installed new packages that broke the setup, or maybe your workstation is not around and you have couple hours you could really use to work on your project, but thoughts about configuring everything on some other workstation makes you sick. Yeah, we all been there...

> Wait, there is must be a better way!

![Better way](/assets/posts/better_way.gif "Better way!")

Indeed there is and I hope to show it in this post. I can hear people whisper "Vagrant Vagrant" blah blah.. No, who cares about it these days right?

### Meet docker + hodor

I bet most of you heard ( and some even tried ) [docker](http://www.docker.com) in the past, so I'll just explain very briefly what it is and we move on:

> Docker allows you to package an application with all of its dependencies into a standardized unit for software development.

Did I just steal that line from docker website? Even if I did, only because it describes the concept pretty well.

Ok, then what the hell is [Hodor](https://github.com/gansbrest/hodor)??

Hodor is the little tool I wrote to simplify and streamline docker workflow on Mac and Linux. I also wrote more detailed post about it - [Docker VM shortcomings and how Hodor can help](/infrastructure/2014/09/24/docker-vm-shortcomings-and-how-hodor-can-help/).

Now lets go ahead and install both tools. Just follow instructions on docker site and github repo, it should be pretty straightforward process.

### And now we go

At this point I assume Docker and Hodor were installed and function properly. Let's build docker container with environment required by our app. Yes, we still need to do it, but in the future we just download and use pre-built docker image.

To save us some time I already created a repo with Dockerfile and app configs - [https://github.com/gansbrest/dockerfiles/tree/master/php/nginx-fpm-5.3](https://github.com/gansbrest/dockerfiles/tree/master/php/nginx-fpm-5.3)

We can just clone it and build our own container `docker build -t username/repo-name . ` and maybe even upload to the dockerhub `docker push username/repo-name`. ( _don't forget to substitute username with dockerhub username and repo-name with anything you like_ ).

Next and last step is to create a file called `.hodorfile` which will define hodor tasks for our app. Here is example:

{% gist gansbrest/7873c95c59b03a9b2e7d %}

`.hodorfile` needs to be placed in the root of our project and commited to the repo, so every project developer involved in the project has it.

At this point everything is pretty much done. Next time we destroy our local workstation (_yeah, go ahead and do it now!_) we just need fresh install, get docker and hodor and `hodor run` to start the app, or `hodor test` to run tests. No need to worry about anything else.

Super nice thing about using docker container for all developers is that everyone has the same environment, no more spending countless hours debugging failing test only to find that newer library is used on developers workstation or CI server.

p.s. Well, I lied a little bit - in our particular case with php-nginx container you still need MySQL to function. I just wanted to show general idea and left this implementation detail as exercise for the reader :) MySQL could be placed in its own container and linked or into the same one managed by supervisord.
