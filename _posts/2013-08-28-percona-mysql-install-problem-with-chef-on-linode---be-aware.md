---
layout: post
title: "Percona mysql install problem with Chef on Linode - be aware!"
description: ""
category: infrastructure
tags: [mysql, chef]
---
{% include JB/setup %}

###BAH!

Fresh Linode instance of Ubuntu 12.04 LTS.

Super simple recipe ( stripped down for debugging ).

    include_recipe "apt"
    include_recipe "ohai"

    include_recipe "mysql::percona_repo"
    include_recipe "mysql::server"


I tested installation numerous times with the same OS version with Vagrant with no problems, but when it was time to run it on Linode instance I run into problems like this:

    Chef::Exceptions::Exec
    ----------------------
    apt-get -q -y install percona-server-server=1:5.5.33-rel31.1-566.precise returned 100, expected 0


    Resource Declaration:
    ---------------------
    # In /opt/chef-solo/cookbooks/mysql/recipes/server.rb

    153:   package package_name do
    154:     action :install
    155:     notifies :start, "service[mysql]", :immediately
    156:   end
    157: end

After spending couple days checking and comparing Vagrant box, versions, packages, sources list - you name it, I bet I checked that as well. I was going mad with this problem and was at the point of throwing my workstation out of the window... 

Anyways I was able to trace down the problem which turned out to be my.cnf problem :)

MySQL error.log gave me this helpful hint:

    130828 23:23:29 [ERROR] Can't create IP socket: Success
    130828 23:23:29 [ERROR] Aborting 

(Very helpful I know)

Then I dig a little deeper to discover config problem itself - bind-address was empty:

    bind-address  =

By looking at the mysql cookbook attributes I discovered this line:

    default['mysql']['bind_address'] = attribute?('cloud') ? cloud['local_ipv4'] : ipaddress

Apparently Linode instances are getting cloud attribute ( which kind of makes sense ) but missing local_ipv4 property.

**Finally the FIX - `default['mysql']['bind_address'] = node['ipaddress']` in your application cookbook.** ( I will probably propose a patch for mysql cookbook later )

Hopefully you will this info faster than I did!
