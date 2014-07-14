---
layout: post
title: "AWS AutoScale with SPOT instances and dynamic tagging"
description: ""
category: infrastructure
tags: [aws]
---
{% include JB/setup %}

I was always fascinated by idea of fully automated infrastructures, where instances come and go according to particular factors like network traffic or load increase and you just observe this process form the distance allowing system to heal itself.

Now that these days we mostly deal with Cloud providers and their great APIs, those fully automated environments are not that distant any more..

Today I will be talking about AWS AutoScale feature with SPOT instances and the way we use it at [FastCompany](http://www.fastcompany.com)

### Problem

For us it stared with SPOT instances. Basically the idea behind those is that you set a price for particular machine type and if that price is higher than the current AWS market price, you will get SPOT instances for the current market price. Most of the time SPOT instances are much cheaper than regular "on-demand" ones (note the word **Most of the time**).

By looking at the price history graph, which Amazon conveniently offers for free, we can notice that SPOT prices are constantly fluctuating. If the market price goes above the one we specified (and that happens quite often I can assure you), our SPOT instances will be immediately terminated. What does it mean for us? - if you want to effectively utilize SPOT instances, you need to design you application so it could tolerate sudden failures (some kind of retry policy).

One other thing I would like to mention is poor UI and tagging functionality when it comes to SPOTs. If you use tags with incrementing numbers for the hostname configuration on boot ( like prod-web-01, prod-web-02 etc ) you pretty much out of luck. If you decide to manage your SPOTs manually (through UI), be ready to monitor Spot Request status and then once request reached "fulfilled" status, you need to rush into your Instances List find your new instance and update tag before you new machine boots. As you can imagine it gets out of hands pretty fast..

To summarize - we want to start, tag (with increment) or replace (in case of failure) SPOT instances **automatically!** without our intervention and just get a notification of the events occurred.

### Solution

It turns out that Amazon provides a set of command line tools to simplify instance startup automation and monitoring. Meet [AWS AutoScaling](http://aws.amazon.com/autoscaling/).

If you try to follow the link I gave you and read some help pages, it may seem overly complicated, but it's really not and I'll show you main building blocks right now.

Well, it's always a good idea to read some smart and detailed docs, so I recommend [this one](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-autoscaling-notifications.html).

Basically once you [downloaded](http://aws.amazon.com/developertools/2535?_encoding=UTF8&jiveRedirect=1) and [installed](http://docs.aws.amazon.com/AutoScaling/latest/DeveloperGuide//UsingTheCommandLineTools.html) CLI tools it boils down to just couple simple steps (commands):

1. Create Launch configuration ( `as-create-launch-config` ) - here you create template for your instances where you set things like IAM role, instance type, user-data, security group etc.

    Here is the example:

        as-create-launch-config prod-web-spot --image-id ami-05ba9f6c --instance-type c1.xlarge --iam-instance-profile prod-web \ 
        --monitoring-enabled --user-data-file /var/www/config/scripts/prod-web.userdata --group prod-web --key fastcompany --spot-price 1.2

    **Important: You need to create different launch configuration for SPOT (--spot-price switch) and regular on-demand instances, you can't mix both.**

2. Create Auto Scaling Group ( `as-create-auto-scaling-group` ) - here you specify the *behaviour* of the machines in the group using properties like --max-size, --min-size, --grace-period ( that's time in seconds after instance startup, before first health check is performed ), --load-balancers ( you can set ELB name here and new instance will be added there automatically, after both instance and ELB health checks were passed successfully! ).

    Example:

        as-create-auto-scaling-group prod-web --launch-configuration prod-web-spot --availability-zones "us-east-1a" --max-size 2 --min-size 1 --grace-period 720 --health-check-type ELB --load-balancers prod-workers

    Couple words about --health-check-type switch. If you don't specify ELB value, AWS will monitor just the internal instance state. It uses DescribeInstanceStatus call and if return contains any state other than running, the instance in question will be automatically termiated and replaced with new ones ( which is pretty useful actually ). If you set `health-check-type` to ELB, then in addition to what I said above you will add regular Load Balancer checks.

    Now using just those two commands you can have your instances automatically started and monitored by AWS. If you specify min-size > 0 then you should see you new machines in the AWS UI! Try terminating one manually and it will be automatically replaced. Cool right?

3. Attach notifications (`as-put-notification-configuration`) - remember we wanted to know when AWS terminate or start new machines. Using this command we attach notifications to our Auto Scaling Group ( you'll need to create SNS topic first ).

   Example:

        as-put-notification-configuration prod-web --topic-arn arn:aws:sns:us-east-1:882684183:AutoScalingNotifications --notification-types autoscaling:EC2_INSTANCE_LAUNCH, autoscaling:EC2_INSTANCE_TERMINATE

   Once our Auto Scaling Group is associated with SNS topic, we can create as many subscribers as we need. You can start with email Subscriber and try to terminate instances with `as-describe-auto-scaling-instances
` (to get instance ids) and `as-terminate-instance-in-auto-scaling-group instance_id` commands. You should start getting email notifications upon termination and autostart (if --min-size > 0).


#### Dynamic tagging with auto incrementing numbers

Now let's see how we can implement dynamic instance tagging.. You probably already noticed by now that machines started with AutoScale doesn't have a Name tag, i.e. appear as blanks in the AWS UI. If you are not using auto incrementing numbers like we do, you may be able to get away with `as-create-or-update-tags` command with `PropagateAtLaunch` flag ( you can read more details [here](http://docs.aws.amazon.com/AutoScaling/latest/DeveloperGuide/ASTagging.html) ).

Keep reading if you need to create dynamic Name tag with auto increment for every new instance started. You may already guessed by now that there is no out-of-the box solution for that (at least not at the time of writing). We will need to get our hands dirty and implement it ourselves using AWS API. Fortunately it's not as hard as it may seem.

> I'll just outline the idea, feel free to ping me if you need to see the implementation.

**Update**: Since multiple people asked me for the code sample - I decided to put it [here](https://github.com/gansbrest/aws-autoscale-dynamic-tagging). Be ready to adjust to your own needs. Enjoy!

Remember we have SNS topic with Email subscriber? Now we need to add HTTP(S) one, so we can create a script which will get the message, parse out the body and get InstanceId and Action. In addition to that, every instances started by AutoScale has `aws:autoscaling:groupName` tag, so you can use that as base for your dynamic tagging (or you may add more tags for your AutoScale groups with `as-create-or-update-tags` as you see a fit).

Here the logic outline which worked for us: SNS -> HTTP -> simple Nodejs app -> check Action and get instance ID -> Get Instance Tags, particularly aws:autoscaling:groupName value -> issue API call through nodejs SDK to get all instances that match that prefix -> sort those, get latest number, increment by one -> tag instance with newly generated Name tag.

I think it's pretty trivial to create such a script in the language of your choice, but I recommend nodejs as it fits perfectly for this simple server app.

As a bonus for those who read the whole post here is a link for [AutoScaling Quick Reference Card!](http://awsdocs.s3.amazonaws.com/AutoScaling/latest/as-qrc.pdf) :)
