---
layout: post
category : infrastructure
title: "Problem with Drupal 6  CURL and Simpletest"
tags : [simpletest, testing, drupal]
---

When I had to switch from my usual Linux dev box to Mac 10.7 recently (because of Sandy hurricane), I noticed a problem with  CURL when I was running my tests through command line.

Basically CURL was just returning output to STDOUT instead of passing it to a variable as it should because of RETURNTRANSFER option in the simpletest class.

After some debugging I figured that the problem was related to the `CURLOPT_COOKIEJAR => $this->cookieFile` line. I understood the idea of having clean environment for each test run, but some versions of CURL just don’t like when cookieFile is NULL.

Here is the small patch for Drupal 6:

[https://gist.github.com/4145077](https://gist.github.com/4145077)

The problem seems to be fixed in a similar way in Drupal 7 and up according to [http://drupal.org/node/1671200](http://drupal.org/node/1671200).
