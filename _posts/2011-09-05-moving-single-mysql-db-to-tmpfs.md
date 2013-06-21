---
layout: post
category : infrastructure
title: "Moving single MySQL database to tmpfs"
tags : [mysql, drupal, io, tutorial]
---

Recently I had a problem running Drupal Simpletest on my new i7 dev box. It took couple minutes to execute a set of relatively simple tests and as a developer you probably know how annoying that could be.  The problem was largely due to InnoDB storage engine and it slowness caused by creating / removing tables (compared to let say MyISAM).

The solution I came up with was to move that single Drupal databse to in-memory (tmpfs) partition. Luckily I had couple of free gigs of ram to spare.

I was able to reduce Drupal Simpletest exectuion time from aprox 2 minutes to 9 seconds! That’s impressive! Hope those instructions will work for you as well!

Here is how I did it:

First we need to create a tmpfs partition in your fstab ( /etc/fstab on my box) :

`tmpfs /var/lib/mysql/tmpfs  tmpfs rw,nosuid,nodev,uid=115,gid=123 0 0`

Note: 115 and 123 are uid and gid of mysql user. To get those on your Ubuntu box you can run

`id -u/-g mysql`

After partition was created:

`sudo mkdir /var/lib/mysql/tmpfs` - create mount point

`sudo chown mysql:mysql /var/lib/mysql/tmpfs` - change the owner of the folder to mysql since we create it inside mysql dir

`sudo mount -a` - mount partition

Then we move our Drupal database from it’s old location ( */var/lib/mysql/drupal_db* on my box )  to

the newly created partition (*/var/lib/mysql/tmpfs* in our sample):

**Important: Don’t forget to stop mysql server first!**

`cd /var/lib/mysql`

`mv drupal_db tmpfs`

Note: You can skip following section and go directly to Make changes permanent below

Since we are moving just one database instead of whole mysql data folder, we create a symlink to our drupal_database so mysql could still find it at its old location:

`ln -s tmpfs/drupal_db drupal_db`

After that you should be able to start mysql server and have drupal_db running in memory.

If  you see your database in the list of databases when you start mysql then you are almost there, the final and very important step is to make changes “permanent”, so your database could survive mysql server start / stop events.

**Important: If you will reboot your server / workstation without copying files from tmpfs back to hardive, you will lose the database!**

#### Make changes permanent or survive server reboot

There are multiple ways to do this, you can either write a job which will start before and after mysql, or you can just modify mysql init script.  For the sake of simplicity we will use the last mentioned method.

Usually you can find your mysql init script in /etc/init.d/mysql. Add following lines in bold to the start) section after the first else statement:

    log_daemon_msg "Starting MySQL database server" "mysqld"

    if mysqld_status check_alive nowarn; then

        log_progress_msg "already running"

        log_end_msg 0

     else

         # Copy drupal db into tmpfs

         mv /var/lib/mysql/drupal_db /var/lib/mysql/tmpfs

         ln -s /var/lib/mysql/tmpfs/drupal_db /var/lib/mysql/drupal_db

         /usr/bin/mysqld_safe > /dev/null 2>&1 &


and

    log_failure_msg "Please stop MySQL manually and read /usr/share/doc/percona-server-server-5.1/README.Debian.gz!"

        exit -1

    else

      # Copy our Drupal db back to hardrive

      rm /var/lib/mysql/drupal_db

      mv /var/lib/mysql/tmpfs/drupal_db /var/lib/mysql

      log_end_msg 0

    fi

That’s about it! You can test if those commands by starting and stopping your mysql instance and checking your databases list.


