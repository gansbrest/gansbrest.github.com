---
layout: post
category : infrastructure
title: "Nginx proxy_read_timeout catch or double php script execution"
tags : [nginx, php]
---

I was working on import script recently. Expected execution time was more than 60 seconds, the default value of proxy_read_timeout directive in Nginx that’s why Nginx displayed nice 504 Gateway Timeout error every time I run the script, even though the script was still running on the back end.

I didn’t pay attention until I noticed that my import script gets executed multiple times even though I executed it just once (by going to script url in the browser).. That problem was driving me nuts because I was trying to figure what triggers second script execution. After countless hours spent on debugging I finally figured that the problem was caused by Nginx proxy_read_timeout directive..

It turned out that after read_timeout interval passed, Nginx would call that script one more time trying to get the response, so for me it meant that two jobs were executing in parallel updating same resource (database in my case) at the same time, causing unexpected behaviour..

To demonstrate the problem I wrote super simple php script:

```
<?php
error_log('script run');
sleep(10);
?>
```

and in this case your proxy_read_timeout should be less that 10 seconds. In the error log you will see 2 entries instead of one.

For most scripts that behaviour is not a problem, but make sure you increase Nginx read_timeout for critical scripts which are taking some time (more than default 60 seconds) to execute.. 
