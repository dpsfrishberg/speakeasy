# Create your views here.
from django.http import HttpResponse
from django.shortcuts import render_to_response, redirect
from django.core.context_processors import csrf
from speakeasy_core.models import Article, Node, ArticleNode, SpeakeasyComment, CommentNode, Domain, get_current_timestamp as _get_current_timestamp
from speakeasy_core.forms import AccountCreationForm

import json
import re
import urllib
from urlparse import urlsplit

from django.conf import settings
from django.contrib.auth import (
    REDIRECT_FIELD_NAME, authenticate, login as auth_login)
from django.contrib.auth.models import Group
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.template.loader import render_to_string

from openid.consumer.consumer import (
    Consumer, SUCCESS, CANCEL, FAILURE)
from openid.consumer.discover import DiscoveryFailure
from openid.extensions import sreg
from openid.extensions import ax
from django.contrib.auth.decorators import login_required
from django.core.mail import send_mail

def notify(comment, user):
    commenters = comment.article.get_subscribers()
    for commenter in commenters:
        send_mail('New comment by %s' % user.email,
                  '%s: %s' % (reduce(
                                lambda x, y: "%s\n\n%s" % (x, y),
                                [node.content for node
                                 in CommentNode.objects.filter(comment=comment)],
                                ''),
                              comment.node.permalink
                              ),
                  settings.DEFAULT_FROM_EMAIL,
                  [settings.DEFAULT_FROM_EMAIL, commenter.email],
                  fail_silently=False)


def splash(request):
    return render_to_response("splash.html")

def index(request):
    articles = Article.objects.all()
    return render_to_response("index.html", {"articles": articles})

def tree(request, slug=None, node=None):
    obj = {}

    if node is None:
        article = Article.objects.get(slug=slug)
        nodes = ArticleNode.objects.filter(article=article)
        for node in nodes:
            obj[node.id] = tree(request, node=node)
        return HttpResponse(json.dumps(obj), mimetype='application/javascript')
    elif type(node) == SpeakeasyComment:
        user = {'id': node.user.id, 'firstName': node.user.first_name, 'lastName': node.user.last_name}
        obj = {'type': 'comment', 'id': node.id, 'nodes': {}, 'user': user}
        comment_nodes = CommentNode.objects.filter(comment=node)
        for comment_node in comment_nodes:
            obj['nodes'][comment_node.id] = tree(request, node=comment_node)
        return obj
    else: # type(node) == ArticleNode or type(node) == CommentNode
        comments = SpeakeasyComment.objects.filter(node=node)
        obj = {'type': 'node', 'id': node.id, 'comments': {}, 'content': node.content}
        for comment in comments:
            obj['comments'][comment.id] = tree(request, node=comment)
        return obj


def article_nodes(request, slug=None):
    obj = {}
    article = Article.objects.get(slug=slug)
    
    nodes = ArticleNode.objects.filter(article=article)
    for node in nodes:
        num_comments = node.num_comments()
        obj[node.id] = {'type': 'node', 'id': node.id, 'content': node.content, 'num_comments': num_comments, 'updated': node.updated}
    return HttpResponse(json.dumps(obj), mimetype='application/javascript')

def node_comments(request, slug=None):
    obj = {}
    node_id = request.GET['node_id']
    node = Node.objects.get(id=node_id)
    comments = SpeakeasyComment.objects.filter(node=node)
    
    for comment in comments:
        user = comment.user
        obj[comment.id] = {'id': comment.id, 'user': {'id': user.id, 'first_name': user.first_name, 'last_name': user.last_name, 'username': user.username}, 'nodes': {}}
        nodes = CommentNode.objects.filter(comment=comment)
        for node in nodes:
            num_comments = node.num_comments()
            obj[comment.id]['nodes'][node.id] = {'id': node.id, 'content': node.content, 'num_comments': num_comments, 'updated': node.updated}
    
    return HttpResponse(json.dumps(obj), mimetype='application/javascript')
    

def node_ancestors(request, slug=None):
    # TODO: Use Node.get_ancestors()
    obj = {'node': None, 'ancestors': []}
    node_id = request.GET['node_id']
    while True:
        node = CommentNode.objects.filter(id=node_id)
        if len(node) == 0: # It's an article node.
            node = ArticleNode.objects.filter(id=node_id)
            if len(node) != 0:
                if obj['node'] is None:
                    num_comments = node[0].num_comments()
                    obj['node'] = {'id': node[0].id, 'content': node[0].content, 'num_comments': num_comments, 'updated': node[0].updated}
            break # We're done, because you can't go up past an article node.
        else: # It's a comment node.
            node = node[0]
            if obj['node'] is None:
                user = node.comment.user
                user = {'id': user.id, 'first_name': user.first_name, 'last_name': user.last_name, 'username': user.username}
                num_comments = node.num_comments()
                obj['node'] = {'id': node.id, 'content': node.content, 'user': user, 'num_comments': num_comments, 'updated': node.updated}
            parent_node = CommentNode.objects.filter(id=node.comment.node.id)
            if len(parent_node) == 0:
                parent_node = ArticleNode.objects.filter(id=node.comment.node.id)[0]
                user = None
            else:
                parent_node = parent_node[0]
                user = parent_node.comment.user
                user = {'id': user.id, 'first_name': user.first_name, 'last_name': user.last_name, 'username': user.username}
            
            
            num_comments = parent_node.num_comments()
            obj['ancestors'].insert(0, {'id': parent_node.id, 'content': parent_node.content_teaser(), 'num_comments': num_comments, 'user': user, 'updated': parent_node.updated})
            node_id = parent_node.id
    return HttpResponse(json.dumps(obj), mimetype='application/javascript')

def comment_nodes(request):
    pass

def comment_parent(request):
    pass

def post_comment(request, slug=None):
    node_id = request.POST['node_id']
    content = request.POST['content']
    timestamp = request.POST['last_updated']
    user = request.user
    node = Node.objects.get(id=node_id)
    comment = SpeakeasyComment(node=node, user=user,article=node.article)
    
    comment.save()
    
    comment_nodes = []
    content_node_strings = content.split("\n")
    for content_node_string in content_node_strings:
        content_node_string = content_node_string.strip()
        if len(content_node_string) == 0:
            continue
        comment_node = CommentNode(content=content_node_string, comment=comment,article=node.article)
        comment_node.save()
        comment_nodes.append(comment_node)
    
    notify(comment, request.user)

    obj = {}
    comments = {}
    comments[comment.id] = {'comment_id': comment.id, 'node_id': node_id, 'user': {'id': user.id, 'first_name': user.first_name, 'last_name': user.last_name, 'username': user.username}, 'nodes': {}}
    for comment_node in comment_nodes:
        num_comments = comment_node.num_comments()
        comments[comment.id]['nodes'][comment_node.id] = {'node_id': comment_node.id, 'comment_id': comment.id, 'content': comment_node.content, 'num_comments': num_comments, 'updated': comment_node.updated, "ancestors": comment_node.get_ancestors()}
    obj["comments"] = comments
    obj["timestamp"] = _get_current_timestamp()
    obj["new_nodes"] = _get_node_changes(slug, timestamp)
    
    return HttpResponse(json.dumps(obj), mimetype='application/javascript')
    
def check_comments(request, slug=None):
    article = Article.objects.get(slug=slug)
    comments = SpeakeasyComment.objects.filter(article=article);
    obj = {}
    for comment in comments:
        user = comment.user
        obj[comment.id] = {'id': comment.id, 'user': {'id': user.id, 'first_name': user.first_name, 'last_name': user.last_name, 'username': user.username}, 'nodes': {}, 'node_id': comment.node.id}
        nodes = CommentNode.objects.filter(comment=comment)
        for node in nodes:
            num_comments = node.num_comments()
            obj[comment.id]['nodes'][node.id] = {'id': node.id, 'content': node.content, 'num_comments': num_comments, 'updated': node.updated}
            
    return HttpResponse(json.dumps(obj), mimetype='application/javascript')
    
def _get_node_changes(slug, timestamp, exclude=[]):    
    article = Article.objects.get(slug=slug)
    obj = {}
    #obj["timestamp"] = _get_current_timestamp()
    obj["nodes"] = {}
    nodes = Node.objects.filter(article=article, updated__gt=timestamp);
    updated_times = [node.updated for node in nodes]
    obj["timestamp"] = max(updated_times) if len(updated_times) > 0 else timestamp
    for node in nodes:
        obj["nodes"][node.id] = {"num_comments": node.num_comments(), "updated": node.updated}
        #for a_node in node.get_self_and_ancestor_nodes():
        #    if not a_node.id in exclude:
        #        obj["nodes"][a_node.id] = {"num_comments": a_node.num_comments(), "updated": a_node.updated}
    return obj

def get_node_changes(request, slug=None, timestamp=None):
    obj = _get_node_changes(slug, timestamp)
    return HttpResponse("data = " + json.dumps(obj), mimetype='application/javascript')

def article(request, slug=None):
    
    article = Article.objects.get(slug=slug)
    context = RequestContext(request)
    context.update({'anonymous': request.user.id is None, 'article_slug': slug, 'title': 'Speakeasy - %s' % article.title })
    context.update(csrf(request))
    return render_to_response('article.html', context)

@login_required
def list_domains(request):
    return render_to_response('account/list.html', {'domains': Domain.objects.filter(admins=request.user)})

@login_required
def create_account(request):
    user = request.user
    if request.method == "POST":
        response = ""
        data = request.POST

        for domain_name in data.get("domains", "").replace("\r\n", "\n").split("\n"):
            domain = Domain(name=domain_name)
            domain.save()
            domain.admins.add(user)
            domain.save()
            
        return redirect("/account/list")
    else:
        context = RequestContext(request)
        context.update({'anonymous': request.user.id is None, 'form': AccountCreationForm(), 'title': 'Create an Account'})
        context.update(csrf(request))
        return render_to_response('account/create.html', context)
