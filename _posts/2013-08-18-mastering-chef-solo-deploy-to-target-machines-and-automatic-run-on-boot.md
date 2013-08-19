---
layout: post
title: "Mastering chef-solo: deploy to target machines and automatic run on boot"
description: ""
category: infrastructure
tags: [chef-solo]
---
{% include JB/setup %}

This post will cover some basics behind chef-solo and the way I use it to configure machines.

With recent [changes](http://docs.opscode.com/breaking_changes_chef_11.html) to attributes introduced in Chef 11 chef-solo became even more useful for small infrastructures and testing cookbooks with [Vagrant](http://www.vagrantup.com/).

### What

As you probably already know chef can function in two modes:

* chef client and server ( one server many clients ) - every client executes chef-client which creates a connection to the chef server and pulls down recipes according to the run list.

* chef solo mode ( no server required ) - we need to push our cookbooks and run list to the target box somehow and then execute chef-solo.

Lets take a look at the second option more closely.

### Deploy chef-solo to the target machine

Ideally the process of pushing cookbook changes should be fast and easy, so how do we do it with chef-solo?

I'll just explain my way of doing it and if you think you have better approach - feel free to share in comments.

Basically the idea boils down to creating usual chef repo layout ( `git clone git://github.com/opscode/chef-repo.git` ) where ideally your cookbooks folder is controlled by one of the cookbook management tools like [librarian-chef](https://github.com/applicationsonline/librarian-chef) or [berkshelf](http://berkshelf.com/).

I won't go into too much details about any of these tools. I'll just say that both of them are great. Personally I started with librarian since it was easier for me to grasp main chef concepts with it, but longterm I think berkshelf will win, since it's provides more flexible approach, but at the same time it may take you more time to adjust to berkshelf way of thinking ( like having no need for chef repo, where all your cookbooks are assembled and deployed automatically from some hidden location and eventually CI server bumping cookbook versions etc ). In my opinion it could be a little hard for chef beginners.

Anyways at this point I assume you have a folder with your community and custom books. Now back to deploying and applying changes from those cookbooks.

I created public [github repo](https://github.com/gansbrest/chef-solo) with my version of deploy scripts. I think I found some parts of it on some other website and modified pieces here and there. Please use those scripts as a draft for you own version. Don't be afraid to look inside and adjust to your needs.

Copy deploy scripts from the repo to the root of your chef repo.

We also need to create the configuration for chef-solo. Inside your chef repo create a folder called .chef, it's going to store **solo.rb** and optionally your data bag encryption key.

Here is the contents of my solo.rb:

    root = File.absolute_path(File.dirname(__FILE__))

    data_bag_path root + '/../data_bags'
    role_path root + '/../roles'

    encrypted_data_bag_secret root + '/../.chef/encrypted_data_bag_secret'

    # Later entries override earlier ones:
    cookbook_path [
      root + '/../cookbooks',
      root + '/../site-cookbooks'
    ]


We will be pointing chef-solo to this config file, so make sure you get it right.

Next important step is run list creation. In the root of your chef solo repo create a file called **solo.json**:

    {
      "run_list": ["role[mix]"]
    }

My advice is to keep your run lists very short and use custom application cookbooks to make attribute overrides. Even if you need to make just a few attributes changes to nginx, create app_nginx cookbook in the site-cookbooks folder. More on this [here](http://dougireton.com/blog/2013/02/16/chef-cookbook-anti-patterns/).

At this point we should be ready to deploy our cookbooks and execute them on the target machine! Here is how you do it:

`./deploy.sh -f`

Where:

**-f** - means first boot. If you looked at the deploy.sh you saw that if you pass -f flag it will use vagrant@192.168.3.3 (address of may virtual box) while executing ssh later in the script. If you not gonna pass -f flag it will use gansbrest@192.168.3.3. **Make sure to adjust there values to your username and ip!**. 
*Homework - make this script to optionally accept any address, possibly through command line switch and contribute via pull request.*

**-h** - stands for hostname. I found it much easier to set hostname of the machine before chef run, so you don't need to deal with ohai updates. Trust me - it's much easier this way!

`./deploy.sh -f -h mix.domain.com` - that will set hostname before first chef run

If you will want to turn off password logins and only keep ssh ( which I highliy recommend ), you can then just use:

`./deploy.sh` - for your next runs

### Behind the scenes

Let me explain a little about what's goind on when you run deploy.sh:

1. deploy.sh reads command line options, archives current dir and copies it to the target machine / server via ssh.

2. once files are copied, deploy.sh unarchives those into /opt/chef-solo dir on the server and calls install.sh, passing it come command line options as well and the location of the chef solo directory.

3. install.sh prepares the server for chef-solo run. Runs system update, install some gems and chef as well ( via `curl -L https://www.opscode.com/chef/install.sh | sudo bash
` ).

4. once chef is installed install.sh runs chef-solo like this

`"$chef_binary" -c $1/.chef/solo.rb -j $1/solo.json` - where $1 is the argument passed from deploy.sh which is chef-solo location on the server.

Once again, I recommend you to read and understand deploy scripts before using them.

### Run chef-solo automatically on boot/reboot

You may be wondering why would you want to do this? It's certainly possible to only run chef-solo manually by using deploy.sh, but in that case you need to make sure you have all of the init scripts on the box configured and enabled to run for your runlevel, so when you reboot the box, it will come back to the same state it was before the reboot. 

I find it easier just to run chef-solo automatically right after reboot to bring the machine to the pre-reboot state. And fortunately it's very easy to do. Actually it's already part of your deploy.sh script. If you noticed there is one more file in the deploy scripts repo called chef_solo_boot.conf, it's just a simple upstart script (**tested on Ubuntu only**) which will be placed under /etc/init dir on the server and will be executed on boot. If you are not using Ubuntu, you probably should convert it to sysv init script, or do it in some other way ( deploy it as part of the chef run for example ).

As you can see chef-solo is a very powerful tool if you use it right. You can use it to create complex solutions and avoid chef-server entirely, just use the imagination! )
