---
layout: post
title: "Build Zappos like faceted navigation with ElasticSearch"
description: ""
category: 
tags: [howto, elasticsearch, facets]
---
{% include JB/setup %}

I've been looking at different facets implementations while working on REST Search API for my ecommerce store. Some of the solutions I saw were simple to achieve (like plain faceting by terms with single selection), while others required some thinking and some extra work.

Today we will talk about [Zappos](http://www.zappos.com) facets, since in my mind they do interesting things with products grouping (seems like they refer to it as *[NavWow](http://blogs.zappos.com/blogs/technology/navwow-multi-select)* sidebar). One of the key things about Zappos facets implementation is **multi select within active bracket**, which significantly improves and simplifies navigation experience for end customers.

Lets look at some examples to illustrate what I'm talking about:

**Starting point**: Imagine we have 3 simple documents in our ElasticSearch (will refer to it as ES in the future) index:

    curl -XPUT 'http://localhost:9200/twitter/tweet/1' -d '{
        "user": "gansbrest",
        "tag": "red"
    }'

    curl -XPUT 'http://localhost:9200/twitter/tweet/2' -d '{
        "user": "greenbean",
        "tag": "green"
    }'

    curl -XPUT 'http://localhost:9200/twitter/tweet/3' -d '{
        "user": "max",
        "tag": "brown"
    }'

At this point we should have 3 docs in our index ( confirm by doing simple search `curl -XGET http://localhost:9200/twitter/_search?pretty=true` )

Ok, so let say we want to facet on **user** and **tag** fields and display those on the sidebar for our users amusement! Here is how:

    curl -XGET 'http://localhost:9200/twitter/tweet/_search?pretty=true' -d '{
        "aggs": { 
           "user": {
              "terms": {
                 "field": "user"
              }
           },
           "tag": {
              "terms": {
                 "field": "tag"
              }
           }
        }
    }
    '

**Note:** If we don't provide `query` field for our search body, it's assumed we are operating on the whole dataset `match_all: {}`.

Visually in UI (once you create it) it will look like this:

<div style="text-align:center" markdown="1">
![all ES facets](/assets/posts/all_facets.png "All ES facets")
</div>

#### Simple ElasticSearch facets filters ( I recommend to switch to [aggregations](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/search-aggregations.html) in more recent versions of ES, since facets are deprecated. )

Let say user clicks on "gansbrest" facet value. Now we have two options of how to represent ES request:

1. As regular **AND** filter (**AND** because we want to combine facets to narrow user selection instead of expanding those with **OR**)

        curl -XGET 'http://localhost:9200/twitter/tweet/_search?pretty=true' -d '{
            "filter": { "and": [ { "terms": { "user" : ["gansbrest"] } } ] },
            "aggs": { 
              "user": {
                "terms": {
                  "field": "user"
                }
              },
              "tag": {
                "terms": {
                  "field": "tag"
                }
              }
            }
        }
        '

    Lets look at the UI:

    <div style="text-align:center" markdown="1">
    ![regular AND filter](/assets/posts/facet_filter_1.png)
    </div>

    The problem is pretty obvious - facets were calculated before filter was applied. Not what we need, right?

2. As **filtered query**. The idea here is to reduce dataset first and then apply query (if any) and calculate facets. Let's see what happens now:

        curl -XGET 'http://localhost:9200/twitter/tweet/_search?pretty=true' -d '{
            "query": {
               "filtered": {
                 "filter": { "and": [ { "terms": { "user" : ["gansbrest"] } } ] }
               }
            },
            "aggs": { 
               "user": {
                  "terms": {
                     "field": "user"
                  }
               },
               "tag": {
                  "terms": {
                     "field": "tag"
                  }
               }
            }
        }'

    And ofcourse the UI:

    <div style="text-align:center" markdown="1">
    ![filtered query](/assets/posts/facet_filter_2.png)
    </div>

    As you can see **[filtered query](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl-filtered-query.html)** did a better job. In fact lots of sites are using this sort of faceting. Still this is not exactly what we want.. Why? Because the whole point of multi selection is kind of lost - we have checkboxes, but all other *similar* ( and potentially interesting for our customer ) options are hidden. Not good. We can do better, right?

#### Smart ElasticSearch aggregations - is that what Zappos does?

What if we want to show our potential customer more similar options within the same facet bracket, even if one of the values is already checked. Plus we also need to recalculate all other facets to show only facet values that intersect with other selected items (narrow down docs set). 

Well, I spent quite a bit of time on that one.. Initially I defined a concept of "target facet" and thought of it as the facet I would keep expanded ( show all options regardless of selected values ) but only until other facet brackets didn't have selected values. That took me one step closer to what I wanted, but added additional ES query and only "worked" for one facet bracket. No good.

More time was spent experimenting with extra queries until I discovered [filter aggregation](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/search-aggregations-bucket-filter-aggregation.html). Then it hit me - in order to do what I wanted I needed to provide filter for each aggregation. That filter would exclude own bracket filters from it and only keep filters from other brackets if defined.

Let's go back to our tweets example to see what I'm talking about:

    curl -XGET 'http://localhost:9200/twitter/tweet/_search?pretty=true' -d '
    {
        "filter": { "and": [ { "terms": { "user": [ "gansbrest", "max" ] } } ] },
        "aggs": { 
            "user": {
                "filter": { "match_all": {} },
                "aggs": {
                    "user": {
                        "terms": {
                            "field": "user"
                        }
                    }
                }
            },
            "tag": {
                "filter": { "and": [ { "terms": { "user": [ "gansbrest", "max" ] } } ] },
                "aggs": {
                    "tag": {
                        "terms": {
                            "field": "tag"
                        }
                    }
                }
            }
        }
    }'

Note how we add `filter` field to the whole ES request to get proper docs back, plus each facet has it's own filter. Lets look at our UI as well:

<div style="text-align:center" markdown="1">
![filtered query](/assets/posts/facet_multiselect.png)
</div>

Now I'm happy. Our facets navigation is adaptive, allows multiple selection and it's all one query. I can imagine this approach to introduce more load on our ES cluster, but at the moment all ES requests are executing within **15ms** which is pretty good.

I didn't do [query support](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl-queries.html) yet, but I imagine we may need to convert to filtered query in that case, to narrow down dataset before further operations. Aggregations facets idea should stay in place.

Not sure if Zappos is using ElasticSearch or Solr or any other fulltext engine ( curious to know what it is ), but our latest implementation behaves pretty similarly. Share your thoughts or improvement ideas in the comments section below!
