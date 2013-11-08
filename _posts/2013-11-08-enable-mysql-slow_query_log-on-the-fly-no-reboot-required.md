---
layout: post
title: "Enable mysql slow_query_log on the fly, no reboot required"
description: ""
category: howto
tags: [mysql, performance]
---
{% include JB/setup %}

I always forget how to do this, so finally decided to write it down (I'm talking about mysql > 5.1):

1. Login to mysql with administrator rights
2. Inspect current variables before changing those (optional):

        mysql> show variables like 'long_query_time' \G;
        *************************** 1. row ***************************
        Variable_name: long_query_time
                Value: 10.000000
        1 row in set (0.00 sec)

        mysql> show variables like 'slow_query_log' \G;
        *************************** 1. row ***************************
        Variable_name: slow_query_log
                Value: OFF
        1 row in set (0.00 sec)

        mysql> show variables like 'log_output' \G;
        *************************** 1. row ***************************
        Variable_name: log_output
                Value: FILE
        1 row in set (0.00 sec)

        mysql> show variables like 'slow_query_log_file' \G;
        *************************** 1. row ***************************
        Variable_name: slow_query_log_file
                Value: /var/lib/mysql/web01-slow.log
        1 row in set (0.00 sec)

3. Adjust values to your needs, in my example I will be logging queries which took longer than 50ms

        mysql> set global long_query_time = 0.05;
        Query OK, 0 rows affected (0.01 sec)

        mysql> set global slow_query_log = 1;
        Query OK, 0 rows affected (0.04 sec)

        mysql> flush logs;
        Query OK, 0 rows affected (0.01 sec)

    At this point your log file should start growing and getting data. Make sure you disable it after a while (depends on the workload), so you don't run out of space if there are too many queries that fit into you time `long_query_time` span. Plus it will put more load on the server.

    To disable on the fly just run:

        mysql> set global slow_query_log = 0;
        Query OK, 0 rows affected (0.01 sec)

4. Analyze resulted log file with [mk-query-digest](http://www.maatkit.org/doc/mk-query-digest.html) to find the most offensive queries and fix those

        mk-query-digest /path/to/slow.log


