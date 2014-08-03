---
layout: post
title: "Secure data bag items with chef solo"
description: ""
category: infrastructure
tags: [chef]
popular: true
---
{% include JB/setup %}

#### How to generate encrypted data bag item with knife and chef-solo

> This post is mostly a memo to myself, because I often forget how to how to create encrypted data bag items.. 

Here is the deal. We know how to generate regular data bag items with knife: `knife data bag create DATA_BAG_NAME DATA_BAG_ITEM` ( for those who didn't know ). 

And secure / encrypted version `knife data bag create pass test --secret /path/to/data_bag_key`.

Knife command is awesome and I use it quite a lot, but it might be a little annoying, especially when you deal with data bags. For example like many knife commands it creates data ( data bag item in our case ) directly on the chef server and I'm almost positive you were thinking to store it in the repo, so you could share it with coworkers (just one example).

Fortunately there is an easy workaround:

`knife data bag show pass test --format json > data_bags/folder/item.json` (notice --format json)

Now you have it and can commit to the repo. Here [some more info about data bags](http://docs.opscode.com/essentials_data_bags.html)

#### How do we do the same with chef-solo, when we don't have chef server?

Yes, good question! Initially I was using different custom scripts, which would work almost like `knife data bag create` where it would open data bag item in the editor and create encrypted version on save. When Chef 11 came out, it introduced data bag item format change and as the result some of the scripts I was using for data bag items creation stopped working. I could fix them of course, but at the same time I thought "there should be a better way..". And I found it!

We need to install two little gems:

`gem install knife-solo` ([knife-solo](https://github.com/matschaffer/knife-solo) adds a handful of Knife commands that aim to make working with chef-solo as powerful as chef-server.)

and then: 

`gem install knife-solo_data_bag` ([A knife plugin](https://github.com/thbishop/knife-solo_data_bag) to make working with data bags easier in a chef solo environment.)

**GOTCHA** - Depending on your chef installation method, don't be surprised if you wont find `knife solo` available after those gems installation. If you run `knife solo` and it exists - stop reading and move on! If you installed chef with installer from Opscode, the chances are it's installed under /opt/chef and it provides it's own ruby and gems binaries. Depending on the OS it my link those binaries into regular locations like /usr/bin but don't expect that. Basically if you installed above gems and still missing `knife solo` command, try to use chef embedded gem wrapper - instead of `gem install` you would use `/opt/chef/embedded/bin/gem install`. You can use this method to install other chef related gems as well.

Here I'm assuming you got both gems installed and `knife solo` works. Now you can create data bag items very easily:

`knife solo data bag create pass mysql --secret-file .chef/encrypted_data_bag_secret -c .chef/solo.rb`

two things to mention **--secret-file** - path to your data_bag_secret_key  and **-c .chef/solo.rb** path to your solo/knife confige. You can actually use **encrypted_data_bag_secret** directive inside solo.rb, so you don't need to specify path to the secret key!

Couple more command:

`knife solo data bag show pass mysql`

`knife solo data bag edit pass mysql`

I think you should be good at this point, go create some secure data bag items! 
