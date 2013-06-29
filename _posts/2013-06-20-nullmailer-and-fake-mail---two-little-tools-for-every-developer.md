---
layout: post
title: "Nullmailer and Fakemail - two little tools for every developer"
description: ""
category: 
tags: [mail, tutorial]
---
{% include JB/setup %}

From time to time I need to work with outgoing mails: change templates, make sure they display correct data etc. You could go with some full blown MTA like postfix and it's actually pretty easy to install and configure for outgoing mail sending. I personally tend to not install MTA on my dev box, since I may accidentally send emails to clients..

What I use instead are two little tools called [Nullmailer](https://github.com/bruceg/nullmailer) and [Fakemail](http://sourceforge.net/projects/fakemail/)

### Nullmailer

You can think of nullmailer as sendmail wrapper which just relies messages to another mail host. Most mail functions ( like PHP mail() ) expect sendmail binary installed by MTA, in our case nullmailer provides sendmail binary and as the result all mail flows through it to the mail host you configure. 

On Ubuntu you can install Nullmailer pretty easily, just type:

`sudo apt-get install nullmailer`

Then configuration part - in most cases it's pretty easy. On Ubuntu configs are in `/etc/nullmailer`. 

For my dev box I just added one line to the config /etc/nullmailer/remotes:

`localhost smtp` ( remember I use Fakemail to capture mails and write them to a folder )

and then restart nullmailer

`sudo /etc/init.d/nullmailer restart`

That's about it, at this point you should have Nullmailer forwarding mail to your local smtp port. Read on to find out how to capture outgoing emails on that port.

### Fakemail

Now that we have Nullmailer forwarding mails to our smtp port ( usually 25 ) we need to capture and write those to a folder, so we could actually do some work on our newsletters.

Introducing Fakemail:

> A fake mail server that captures e-mails as files for acceptance testing. This avoids the excessive configuration of setting up a real mail server and trying to extract mail queue content.

To install, just download archive from sourceforge ( I posted a link at the beginning of the post ) or google it. Then all you need to do is launch it. I use following command to start the service:

`sudo /var/www/fakemail-python-1.0/build/scripts-2.7/fakemail.py --port 25 --path /tmp/mails`

**Make sure you specify your own path to the fakemail install, also you need to create a directory where your fake mails will be stored.** 

At this point you should be able to send mails from your scripts and debug them on your dev box!

Enjoy.
