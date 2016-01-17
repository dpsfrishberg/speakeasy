from django.conf.urls.defaults import *

import views

urlpatterns = patterns('',
    url(r'^$', views.splash),
    url(r'^article/id.json$', views.get_article_id),

)
