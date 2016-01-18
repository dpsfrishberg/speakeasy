from django.conf.urls.defaults import *

import views

urlpatterns = patterns('',
    url(r'^$', views.splash),
    url(r'^article/id.json$', views.get_article_id),
    url(r'^article/nodes.json$', views.get_article_nodes),
    url(r'^article/create-node.json$', views.create_node),
    url(r'^article/create-comment.json$', views.create_comment)

)
