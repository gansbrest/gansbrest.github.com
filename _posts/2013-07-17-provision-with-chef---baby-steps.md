---
layout: post
title: "Provision with Chef - baby steps (installation and initial configuration)"
description: ""
category: infrastructure
tags: [chef]
---
{% include JB/setup %}

In the [previous post](/infrastructure/2013/07/02/provision-machines-with-aws---custom-bootsrapper/) I wrote about our pre-chef approach for instance bootstrapping.

---

Today I will explain the process of our migration to Chef. I'm sure that could be useful for someone down the road, who's trying to travel on similar route.

### Starting point

At the time of the migration we had about 35 AWS instances of different sizes and roles, all of those eventually will need to be converted to Chef.. Lots of time will be spent going through the boxes and figuring out what's installed and running there, so it could be converted into the Chef recipes.

So I went ahead and installed open source chef-server 11 ( at the time of writing, use newer version if available ). There is also hosted version provided by Opscode if you don't want through the hustles of installation process. Thankfully that process wasn't so complicated, just follow [installation steps](http://docs.opscode.com/install_server.html) from the Chef site.

> I remember spending a lot of time trying to figure out post installation problem, but unfortunately don't remember what it was.. Something related to install paths inside chef embed on the chef server, so I think I modified some config files there. Just be aware.

> Another interesting thing about chef install is the way it's packaged, everything that needed for Chef-server to function comes bundled and configured, including solr, nginx and other required soft. Very clever.. Moving on

After that part is done I needed to configure my workstation, so I could actually do some useful stuff with Chef. You probably heard, or even tried famous `knife` command - yes, that will be installed as part of chef-client install. Here is a [good tutoral](http://docs.opscode.com/install_workstation.html) I followed at the time.

The most important part is omnibus installer ( that neat prepackaged thing again )

`curl -L http://www.opscode.com/chef/install.sh | sudo bash`

Anyways, I just followed those steps in the tutorial and got chef-client installed on my workstation. Great!

### Chef layout

Now, I have to confess, I did play with chef-solo beforehand, so I had some initial experience with Chef philosophy.

Couple things bothered me at the moment, one of those things was the process of community cookbook modification. I did some research on the topic and two posts stood out to me during the process. First - [Chef Patterns and Anti-Patterns](http://dougireton.com/blog/2013/02/16/chef-cookbook-anti-patterns/), another one is [How to write reusable cookbooks, Gangnam Style](http://devopsanywhere.blogspot.com/2012/11/how-to-write-reusable-chef-cookbooks.html). I highly recommend to get familiar with those materials as they flesh out a lot of really useful Chef concepts. Great materials!

Most important things to take out:

* don't set / override cookbook attributes in the role or environment - those are not versioned, that *could bite you in the ass* during testing and rollout. Use custom cookbooks for that and version them!
* don't modify community books directly - that will create a mess in your repo and you may get stuck with those modified books without upgrade option. Fork and submit pull requests instead. Yay!
* don't use chef roles as a place to specify all cookbooks required for it to function. Try to keep roles clean as possible. Encapsulate role specific logic (attributes, community recipes with `include_recipe`) into custom cookbooks you can version and deploy in steps. 

#### Chef package managers

You probably used package managers before, things like apt, yum, npm, gem, bundler, composer. Guess what? - there are couple solid packaged managers for chef as well. Two of the most popular ones are [Librarian Chef](https://github.com/applicationsonline/librarian-chef) and [Berkshelf](http://berkshelf.com/).

I already hear screams like "_Which one is better?_". I personally have no idea. Google or read [this VS post](http://christian-trabold.de/blog/2012/07/13/librarian-chef-vs-berkshelf/) by Christian Trabold. Don't get too crazy - just pick one and go with it.

I chose Librarian Chef and have no problems with it so far, just for the argument. ))

Having this tool I can simply specify cookbooks I need for the project in the Cheffile, including versions and stuff, even point it to the particular github repo (which turned out to be extremely useful in case you need to fork a book on github and point your Cheffile to your fork, while your pull request is not merged to the upstream ).

#### Back to chef repo layout

If you followed workstation tutorial I mentioned above you should have something similar to this:

    chef-repo/
       .chef/        << the hidden directory
       certificates/
       config/
       cookbooks/
       data_bags
       environments/
       roles/

Every folder here should be pretty self explanatory. One thing I want to expand on is .chef folder. In the tutorial it's recommend not to commit this folder to the repo and there is a good reason for it, you don't want your sensitive data (keys and stuff) to end up in the repo. That's why we added it to .gitgnore.

This doesn't really scale well when you are working in the team, where you knife configuration needs to be shared. Here is great post by Joshua Timberman called [Local-only Knife Configuration](http://jtimberman.housepub.org/blog/2013/02/01/local-only-knife-configuration/)

We decided to follow that and keep modified knife.rb in the repo:

    current_dir = File.dirname(__FILE__)

    log_level                :info
    log_location             STDOUT
    node_name                ENV["NODE_NAME"] || "solo"
    client_key               "#{current_dir}/solo.pem"

    cookbook_path [ 
      "#{current_dir}/../cookbooks",
      "#{current_dir}/../site-cookbooks"
    ]

    if ::File.exist?("#{current_dir}/knife.local.rb")
        Chef::Config.from_file("#{current_dir}/knife.local.rb")
    end

And every team member has their own knife.local.rb version:

    current_dir = File.dirname(__FILE__)

    node_name                "gansbrest"
    client_key               "#{current_dir}/gansbrest.pem"
    validation_client_name   'chef-validator'
    validation_key           "#{current_dir}/chef-validator.pem"
    chef_server_url          'https://chef-server-hostname'
    syntax_check_cache_path  'syntax_check_cache'

    knife[:aws_access_key_id]      = ENV['AWS_ACCESS_KEY_ID']
    knife[:aws_secret_access_key]  = ENV['AWS_SECRET_ACCESS_KEY']

    ..
    other configs like ssh params etc

At this point we have working chef repo layout which we can actually use! Remember that cookbooks folder is for community books and it's controlled by librarian-chef.

Next posts will explain our bootstrap process, which gives us ability to start and configure machines from AWS UI or using knife.

> Continue reading [Provision and Bootstrap AWS instances with Chef](/infrastructure/2013/08/23/provision-and-bootstrap-aws-instances-with-chef/).
