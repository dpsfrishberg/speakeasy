from django.conf.urls.defaults import *

import views

urlpatterns = patterns('',
    url(r'^$', views.splash),
    url(r'^articles$', views.index),
    url(r'^article/(?P<slug>\w+)$', views.article),
    url(r'^article/(?P<slug>\w+)/tree-by-slug.json$', views.tree_by_slug),
    url(r'^article/(?P<id>\d+)/tree-by-id.json$', views.tree_by_id),
    #url(r'^article/(?P<slug>\w+)/article-nodes.json$', views.article_nodes),
    #url(r'^article/(?P<slug>\w+)/node-comments.json$', views.node_comments),
    #url(r'^article/(?P<slug>\w+)/node-ancestors.json$', views.node_ancestors),
    url(r'^article/(?P<slug>\w+)/post-comment.json$', views.post_comment, name="post_comment"),
    #url(r'^article/(?P<slug>\w+)/check-comments.json$', views.check_comments),
    #url(r'^article/(?P<slug>\w+)/(?P<timestamp>\d+)/get-node-changes.json$', views.get_node_changes),
    #url(r'^logout/$', 'django.contrib.auth.views.logout', {'next_page': '/',}, name='logout'),
    
    url(r'^account/create/$', views.create_account),
    url(r'^account/list/$', views.list_domains)

)
