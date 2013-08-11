from django.conf.urls.defaults import *
from django.views.generic.simple import redirect_to

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
from speakeasy.speakeasy_core import views as speakeasy_core_views
admin.autodiscover()

urlpatterns = patterns('',
    # Example:
    # (r'^speakeasy/', include('speakeasy.foo.urls')),

    # Uncomment the admin/doc line below and add 'django.contrib.admindocs' 
    # to INSTALLED_APPS to enable admin documentation:
    # (r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    (r'^admin/', include(admin.site.urls)),
    (r'^$', 'speakeasy_core.views.index'),
    (r'^article/(?P<slug>\w+)$', 'speakeasy_core.views.article'),
    (r'^tree.json$', speakeasy_core_views.tree),
    (r'^article/(?P<slug>\w+)/article-nodes.json$', 'speakeasy_core.views.article_nodes'),
    (r'^article/(?P<slug>\w+)/node-comments.json$', 'speakeasy_core.views.node_comments'),
    (r'^article/(?P<slug>\w+)/node-ancestors.json$', 'speakeasy_core.views.node_ancestors'),
    (r'^article/(?P<slug>\w+)/post-comment.json$', 'speakeasy_core.views.post_comment'),
    (r'^article/(?P<slug>\w+)/check-comments.json$', 'speakeasy_core.views.check_comments'),
    (r'^article/(?P<slug>\w+)/get-node-comment-counts.json$', 'speakeasy_core.views.get_node_comment_counts'),
    url(r'^login/$', 'speakeasy_core.views.login_begin', name='openid-login'),
    url(r'^login-complete/$', 'django_openid_auth.views.login_complete', name='openid-complete'),
    url(r'^logout/$', 'django.contrib.auth.views.logout', {'next_page': '/',}, name='logout'),

)
