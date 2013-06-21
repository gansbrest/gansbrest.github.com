---
layout: post
category : infrastructure
title: "Bootsrap your aws nodes with chef using cloud-init"
tags : [aws, chef]
---

Recently I was trying to figure a way to setup chef-client on our AWS machines in a way we could start / reboot them through Amazon UI or knife.

It turns out that Amazon AMI and most official Ubuntu AMIs provide cloud-init tool which we can use to manipulate user-data.

Here is a link to documenation if you are curious [https://help.ubuntu.com/community/CloudInit](https://help.ubuntu.com/community/CloudInit
)

Now that we have this tool we can do interesting things with node userdata, for example create user_data script which will be executed on boot:

With Knife:

`knife ec2 server create -x ec2-user -I ami-3275ee5b -f c1.medium --user-data ~/path_to/user_data.sh`

user_data.sh

    #!/bin/bash

    curl https://example.com/deploy.io | bash /dev/stdin \

    -c colabs \

    -r webserver \

    -e test

Where deploy.io script is also a bash script which accepts couple command line options -c -r and -e which I defined as CONTEXT, ROLE and ENVIRONMENT

I think you spotted /dev/stdin part in the example above and may be wondering what the hell is this thing. The answer is simple - that’s one of the ways to pass arguments to the downloaded script.

bash manual says:

If the -s option is present, or if no arguments remain after option processing, then commands are read from the standard input. This option allows the positional parameters to be set when invoking an interactive shell.


Ok, so that’s about it. Now we have a custom script which could live on S3 and is not embedded into AMI, which means we can update it pretty easily without switching all boxes to the new AMI if you use some kind of AMI burned script which reads userdata.

With this script we can modify our nodes in any way we want, one useful case would be chef-client installation on boot.

I’m sure you will find your own way to use cloud-init and userdata, so don’t hesitate to share your notes!
