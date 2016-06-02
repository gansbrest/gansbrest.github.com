---
layout: post
title: "Possible MySQL auto_increment duplicates with InnoDB - beware!"
description: ""
category: 
tags: [mysql]
---
{% include JB/setup %}

I was happily eating my apple when one of our developers reached out to me with strange issue. Basically he couldn't fall asleep and decided to go through our mysql binlogs files ( yeah, I know! :) ).

Anyways, earlier this week we discovered some issues with our shipping labels being rejected and our provider said that we were sending duplicate ids. Initially we responded with "impossible" because we knew our shipping_labels table looked like this:

    mysql> describe shipping_labels;
    +----------+------------------+------+-----+---------+----------------+
    | Field    | Type             | Null | Key | Default | Extra          |
    +----------+------------------+------+-----+---------+----------------+
    | id       | int(10) unsigned | NO   | PRI | NULL    | auto_increment |
    | order_id | int(10) unsigned | NO   |     | NULL    |                |
    +----------+------------------+------+-----+---------+----------------+

As you can see that `id` field is set to auto_increment value and we were thinking there was no way it could produce duplicates. Well, that what we thought.

Roll back to 5 mins ago where I said our developer went through binlog files (a must have for any serious site). He discovered two interesting records there:

    SET INSERT_ID=2490/*!*/;
    #160526    7:30:47 server id 1  end_log_pos 16517175 CRC32 0x9f1f72e9   Query      thread_id=258788  exec_time=0 error_code=0
    SET TIMESTAMP=1464247847/*!*/;
    INSERT INTO shipping_labels (order_id) VALUES (310904)

    [[[[[[ SERVER RESTART HERE - READ BELOW ]]]]]]

    SET INSERT_ID=2490/*!*/;
    #160527    7:41:33 server id 1  end_log_pos 20352903 CRC32 0x9d3f696b   Query     thread_id=146371  exec_time=0 error_code=0
    SET TIMESTAMP=1464334893/*!*/;
    INSERT INTO shipping_labels (order_id) VALUES (307322)
 

As you can see both entries have `SET INSERT_ID=2490` and separated by a day. When I saw this, I felt cold sweat on my brow thinking about potential flows in our e-commerce system that could be caused by this auto_increment behaviour. The whole idea didn't sit well with me...

Then I started googling around, asking people on IRC and eventually discovered couple interesting links:

- [http://dev.mysql.com/doc/refman/5.7/en/innodb-auto-increment-handling.html#innodb-auto-increment-initialization](http://dev.mysql.com/doc/refman/5.7/en/innodb-auto-increment-handling.html#innodb-auto-increment-initialization)
- [Be Careful With MySQL's auto_increment. How We Ended Up Losing Data](http://desmart.com/blog/be-careful-with-mysqls-auto-increment-how-we-ended-up-losing-data)

Let me sum up it for you (as I know you are too lazy to read anyways). Basically when you use InnoDB engine, it stores auto_increment counter in memory and it gets erased/reset every time MySQL server restarts.

What happens after restart is on the next UPDATE/INSERT query InnoDB would execute command similar to this one `SELECT MAX(ai_col) FROM t FOR UPDATE; + 1` to re-populate auto_increment counter.

In our case we had two queries in the application going after each other:

    db_query('DELETE FROM {shipping_labels} WHERE order_id = %d', $order_id);
    db_query('INSERT INTO {shipping_labels} (order_id) VALUES (%d)', $order_id);

First we delete and then we insert, so after delete our MAX(ai_col) values was set to 2489 and then InnoDB generated "new" key 2489 + 1 = 2490 which was in use previously.

**Bottom line** - if your application relies on the assumption that auto_increment key could never be repeated, you may need to generate id in the application, or use some triggers or MyISAM table to repopulate auto_increment values after MySQL server restart. Otherwise you may lose faith in technology one day...
