---
layout: post
title: "Provision and Bootstrap AWS instances with Chef"
description: ""
category: infrastructure
tags: [chef,aws]
---
{% include JB/setup %}

> This is continuation of the previous post called [Provision with Chef - baby steps](/infrastructure/2013/07/17/provision-with-chef---baby-steps/). Today we going to talk about the process of bootstrapping instances with Chef used by [FastCompany](http://www.fastcompany.com)

At this point I assume that you already got chef repo setup and wondering how you could use it to configure your fresh instances. If not, go read previous post, I'll wait you here.

Done?

Good, moving on. We have couple options for bootstrapping nodes:

* knife bootstrap - used to run a bootstrap operation that installs the chef-client on the target system. The bootstrap operation must specify the IP address or FQDN of the target system.

It would be something like this:

`knife bootstrap 192.168.1.100 -r 'role[webserver]'`

You can read more information about it [here](http://docs.opscode.com/knife_bootstrap.html). I think this option could be used for small infrastructures, where you don't start and stop boxes often ( aka autoscaling VMs ). Personally I like to avoid manual steps whenever possible, so lets take a look at another fully automated option.

* custom boostrap script - allows to automatically bootstrap and provision nodes. The rest of the article will be focused on this method.

#### Automating chef boostrap in AWS cloud

Since at FastCompany we use AWS as our cloud provider, a lot of assumptions and implementation details will be based in it. It should be relatively straightforward to use and apply the ideas to any provider you choose to use.

Ok, lets start! 

If your read this post [Provision machines with AWS - custom bootsrapper](/infrastructure/2013/07/02/provision-machines-with-aws---custom-bootsrapper/), you probably remember that we had custom bootstrapper script which was added to the end of **rc.local** and would execute on each boot / reboot. The main purpose of the script was to read instance [USERDATA](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AESDG-chapter-instancedata.html) ( you can supply it during instance startup ) and do useful things with it.

Since we already had this script I decided to use it as base for our automated Chef bootstrap. There is one downside to this rc.local approach - you need to modify you clean AMI and add your custom boostrapper script, which means you can't easily switch AMIs with this approach. Not a big deal, but just letting you know. 

Actually there is a workaround you can use and I wrote about it here - [Bootsrap your aws nodes with chef using cloud-init](/infrastructure/2013/03/19/bootstrap-aws-nodes-chef-using-cloud-init/). Wow, I really wrote some useful info in that post )) Yes, so if you want to do it in a totally clean way - go with cloud-init path described in the article.

Whether it's a custom script burned to the AMI or cloud-init (supported by Amazon AMI and most official Ubuntu AMIs) - either way it boils down to reading USERDATA field and configuring box accordingly to the values specified. I'm not going to talk about the process of extracting USERDATA field from within the instance, just don't want to make this article long and hard to read. Maybe I'll write about it in a separate post, will see.

#### Using instance USERDATA field to configure chef

At the moment we use 3 options in USERDATA for each instance startup:

* environment (prod|stage|test - you name it) - directly maps to chef env
* role (solr,nginx..) - directly maps to chef roles
* context (master,colabs) - optional switch that will be available in your cookbooks to alter functionality

Having just these 3 options allows us to create very flexible systems. 

After we supplied values in USERDATA and started the box, our custom bootstrapper script will be called. Its main purpose is to extract env and role and configure chef run accordingly. 

Let's talk about chef configuration part. The way we do it at FastCompany is with private S3 bucket. All files required for chef bootstrap are stored there. Then during machine boot our bootstrapper script goes through following steps ( examples here are written in Perl ):

**1** install the omnibus chef-client 

`curl -L https://www.opscode.com/chef/install.sh | bash /dev/stdin -v 11.4.4`

**2** Make a directory for chef init stuff and populate it:

`mkdir /etc/chef`

then

* download chef_client.rb template:

    `/usr/local/bin/s3curl.pl --key "$secret" --id "$key"  -- $s3curlToken https://s3.amazonaws.com/bucket-name/chef/chef_client.rb`

    Your template may look like this:

        log_level        :auto
        log_location     "/tmp/first-chef-client-run.log"
        chef_server_url  "%%chef_server_url%%"
        validation_client_name "chef-validator"
        node_name "%%node_name%%"
        environment "%%environment%%"

* download and store cleanup scripts, so when you terminate the box it automatically removes it from chef server (very useful for autoscalling):

    `/usr/local/bin/s3curl.pl --key "$secret" --id "$key"  -- $s3curlToken https://s3.amazonaws.com/bucket-name/chef/chef_cleanup.conf` ( upstart script )

        #!upstart
        description "chef cleanup"

        start on starting rc RUNLEVEL=[06]

        task
        exec /usr/local/bin/chef_cleanup.sh > /tmp/clean 2>&1    

    `/usr/local/bin/s3curl.pl --key "$secret" --id "$key"  -- $s3curlToken https://s3.amazonaws.com/bucket-name/chef/chef_cleanup.sh` ( bash )

        #!/bin/bash

        CHEF_NAME="%%node_name%%"
        CHEF_SERVER_URL="%%chef_server_url%%"
        CHEF_CONF_DIR="%%chef_conf_dir%%"

        /usr/bin/knife node delete $CHEF_NAME -y -u $CHEF_NAME -s $CHEF_SERVER_URL
        /usr/bin/knife client delete $CHEF_NAME -y -u $CHEF_NAME -s $CHEF_SERVER_URL
        /bin/rm "$CHEF_CONF_DIR/client.pem"

* download validation key to communicate with chef-server

    `/usr/local/bin/s3curl.pl --key "$secret" --id "$key"  -- $s3curlToken https://s3.amazonaws.com/bucket-name/chef/chef-validator.pem`

* download databag encryption key

    `/usr/local/bin/s3curl.pl --key "$secret" --id "$key"  -- $s3curlToken https://s3.amazonaws.com/bucket-name/chef/chef-db-key`

**3** Finally we create run list

    my $chef_run_list = '';
    if ($user_data->{"role"} ne "") {
      $chef_run_list = '{"run_list":["role[' . $user_data->{"role"} . ']"]}';
    }

    open(my $fh, '>', $chef_conf_dir . '/first-boot.json');
    print $fh $chef_run_list;
    close $fh;

**4** Now we just execute chef-clinet and let it configure out box

    /usr/bin/chef-client -j $chef_conf_dir/first-boot.json

(You can also create one archive and roll it in one go, up to you).

At this point you should be able to easily clone machines with particular roles! They will automatically check-in to the chef-server and configure themselves accordingly to the environment, role and context you specified in the userdata. Great right?

**_By the way it's also possible to pass userdata file with knife ec2 plugin, which means we can start machines from the UI or command line._**

On a closing note, I would like to mention security concerns associated with storing and accessing sensitive data (like chef validation keys). For AWS users I advice to use [IAM ROLES](http://aws.typepad.com/aws/2012/06/iam-roles-for-ec2-instances-simplified-secure-access-to-aws-service-apis-from-ec2.html) instead of passing ACCESS and SECRET keys in the USERDATA field. Once IAM roles were released, we switched to this keys management strategy. You probably noticed that in examples above:

`/usr/local/bin/s3curl.pl --key "$secret" --id "$key"  -- $s3curlToken` ( you can extract keys and token from instance metadata )

For other hosting providers you should create your own keys distribution strategy or figure entirely new way of putting sensitive data to new machines. Would like to hear about that!
