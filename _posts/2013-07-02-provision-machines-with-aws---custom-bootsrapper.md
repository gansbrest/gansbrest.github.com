---
layout: post
title: "Provision machines with AWS - custom bootsrapper"
description: ""
category: infrastructure
tags: [aws]
---
{% include JB/setup %}

In the [previous post](/infrastructure/2013/06/28/history-of-infrastructure-state-at-fastcompany/) I wrote a little about our transition to AWS.

Now I will tell a little more about our instance bootstrap process.

Basically at the end of the previous post we discussed tree possible options for automated machine startup:

1. Create different AMI for each server role.

2. Install all binaries into one ami an provide a way to load dynamic configs parts through some custom bootstrap script.

3. Use infrastructure automation framework like Chef or Puppet, which could handle installs and configuration for you.

---

We tried and quickly abandoned the first option ( many different AMIs ) - it turned out to be a really big headache to maintain those.

Next we tried option 2 - install everything we need into one machine. We actually use this option to this date, which means it's not that bad and can be used with care ( even though I'm not a big fan of it and will tell you why later ).

Anyways, here is how we did it:

* built all binaries and configs into one AMI

* created custom bootstrap script and added it to the end of the rc.local ( that way it will be executed each time instance boots )

I can't paste the whole contents of the custom bootstrapper, but will describe some essential parts:

**1. First step in the boostrapper - fetch userdata field.** We use it to specify 3 things: environment, role and context during instance launch. 

To extract that data we doing a call to `http://169.254.169.254/latest/user-data` which is a special place in AWS where you can get data about running instance.

Example

```
environment=prod
role=memcached
context=b
```

We also use userdata to pass IAM keys to the instance, but this is the whole new discussion and I wont go into more details about it here. I'll just say that with the release of [IAM roles](http://aws.amazon.com/about-aws/whats-new/2012/06/11/Announcing-IAM-Roles-for-EC2-instances/) you don't need to pass keys to the machine any more.

**2. Next section is responsible for the code deploys.**

Couple words about how our release system works. When developers are done committing their changes to git and ready to release their code, they merge changes to master and push to the github. 

Then we have release script which runs remotely on a different server. Its purpose is to prepare build (archive with all necessary files) and upload it to S3. We also have a reference file there at S3 which points to the most recent build tag.

When we launch new instance, our custom bootstrapper runs and when it reaches deploy section, it reads pointer file and fetches specific build from the S3. Clever! 

**3. Custom init section.**

This is the most interesting part I think. The idea is that you can have separate init files, which will be searched and executed in order from most specific to most generic. First found match wins - only one init file gets executed.

```
"$context/$environment/$machine_id.sh",
"$context/$environment/bootstrapper.sh",
"$context/bootstrapper.sh"
```

The idea behind custom bootstrappers was to give you a place to start / stop particular services ( since we have one AMI with all of binaries / services, and we don't want them to always run on the instance ). You could also use it to copy particular config file for the service. 

That was the intention anyways, on practice it wasn't so beautiful - at least for me..

---

Even thought this *"build all into AMI"* approach may seem good at first I found it pretty annoying to deal with. Here are some of the problems I found with this method:

* every change to the config or new service install requires new AMI burn. 

* there is a really high chance that you will burn some sensitive or plain garbage data which shouldn't go into prod AMI..

* after a while you loosing track of services that are available on the AMI, you need to dig through it to refresh memories.. Unless you keep very thorough documentation of every binary you install and every config change you make. Theoretically possible, practically - not so much..

* you can't leverage community like you could with infrastructure automation frameworks

* when you have many servers running, every config change deploy turns out to be pretty annoying experience

Those are just some points on top of my head, I'm sure you can come up with your own list, or start arguing with me about specifics. The point is - you can use this approach and we still do, but I think there are better tools out there created specifically to address problems stated above.

One of such tools called [Chef](http://www.opscode.com/chef/) and we decided to give it a try. In the next posts I will be writing about our transition to Chef. Read on if you are interested.
