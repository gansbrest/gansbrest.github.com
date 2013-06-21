---
layout: post
category : infrastructure
title: "How I solved MySQL I/O problems during cache purges in Drupal"
tags : [mysql, drupal, io, tutorial]
---

Recently I’ve built pretty powerful workstation with I7 CPU and lots of RAM, but noticed very poor performance during devel/cache/clear operations in Drupal. In fact this operation was 5 times slower than on my 3yrs old dev box.

Initially I thought there was a problem with my hardrive (defected?). To prove that theory I run a series of tests using bonnie++ and hdparm -t. According to tests results my new hardrive outperformed old one, so the bottleneck was somewhere else.    

After that I decided to profile MySQL. I used mysqladmin command which has number of useful features including an option to execute given command repeatedly with specified interval, plus it’s capable of computing difference between returned values so you don’t need to do you own math. Awesome!

From my experience with Drupal I knew it executes a bunch of insert / update queries during cache purging (devel/cache/clear), so I wanted to check my innodb transaction log behaviour:

I run mysqladmin `extended-status -i3 -r | grep 'Innodb_os_log'` and went to devel/cache/clear url in the browser.

Here is the results I’ve got:


| Innodb_os_log_written                 | 308224   |

| Innodb_os_log_fsyncs                  | 160    |

| Innodb_os_log_pending_fsyncs          | 0        |

| Innodb_os_log_pending_writes          | 0        |

| Innodb_os_log_written                 | 500608   |

| Innodb_os_log_fsyncs                  | 135        |

| Innodb_os_log_pending_fsyncs          | 0        |

| Innodb_os_log_pending_writes          | 0        |

| Innodb_os_log_written                 | 345012    |

| Innodb_os_log_fsyncs                  | 110    |

| Innodb_os_log_pending_fsyncs          | 0        |

| Innodb_os_log_pending_writes          | 0        |


Immediately I spotted an unusually high number of os_log_fsyncs which probably caused the whole I/O slowness. I figured the default behaviour for InnoDB (at least in MySQL 5) is to flush data (an update to data files)  from transaction log to the durable storage after each transaction commit. While it’s the safest method, it causes a lot of fsyncs() and each call to fsync() is a blocking I/O operation.


Most modern hardrives (not solid state) are capable of performing just couple hundreds disc operations per second, so big number of fsync() operations per second can easily create an I/O bottleneck.

It turned out there is a variable called innodb_flush_log_at_trx_commit which allows us to control where and how often log buffer is flushed.

It has 3 possible settings:

* 0 - write to log buffer then to transaction log and flush the log file every second, but do nothing at transaction commit. Potentially you can lose data in case of mysql crash or power outage.

* 1 - default. Write the log buffer to the log file and flush it to durable storage every time transaction commits. It guarantees that you wont lose any transaction. The drawbacks are blocking I/O calls.

* 2 - Write the log buffer to the log file at every commit, but don’t flush it.

  
0 and 2 are very similar, the difference is that if you use 2 and there was a MySQL process crash, you won’t lose data because of OS cache, which makes it the preferable choice if you can leave without 100% durability.

Basically it’s important to understand that it’s possible to lose transactions if you use anything other than 1.

It didn’t matter so much for me because it was my development machine, that’s why I set innodb_flush_log_at_trx_commit to 2 which dramatically improved I/O performance during cache purging.

**If you really care about durability and can’t handle even minimal data loss, then I would recommend to keep innodb_flush_log_at_trx_commit at default (1) and place transaction log files on a RAID volume with battery-backed write cache.** 
