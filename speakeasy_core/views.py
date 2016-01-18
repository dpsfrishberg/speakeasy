# Create your views here.
from django.http import HttpResponse
from django.shortcuts import render_to_response, redirect
from speakeasy_core.models import Article, Node, Comment

import json

def get_article_id(request):
    url = request.GET.get("url")
    try:
        article = Article.objects.get(url=url)
    except:
        article = Article(url=url)
        article.save()
    return HttpResponse(json.dumps({"id": article.id}))

def get_article_nodes(request):
    article_id = request.GET.get("articleID")
    nodes = Node.objects.filter(article_id=article_id)
    comments = Comment.objects.filter(article_id=article_id)
    return HttpResponse(json.dumps(
        {
            "nodes": [{"nodeID": node.id,
                       "text": node.text,
                       "xpath": node.xpath,
                       "offset": node.offset,
                       "parentID": node.parent_id} for node in nodes],
            "comments": [{"commentID": comment.id,
                          "content": comment.content,
                          "parentID": comment.parent.id} for comment in comments]
        }))

def create_node(request):
    text = request.GET.get("text")
    offset = request.GET.get("offset")
    xpath = request.GET.get("xpath")
    parent_id = request.GET.get("parentID")
    article_id = request.GET.get("articleID")

    if parent_id != "":
        parent_id = None

    node = Node(text=text, offset=offset, xpath=xpath, article_id=article_id, parent_id=parent_id)
    node.save()

    return HttpResponse(json.dumps({
        "nodeID": node.id,
        "text": text,
        "offset": offset,
        "xpath": xpath,
        "parentID": parent_id
    }))

def create_comment(request):
    content = request.GET.get("content")
    article_id = request.GET.get("articleID")
    parent_id = request.GET.get("parentID")

    comment = Comment(content=content, article_id=article_id, parent_id=parent_id)
    comment.save()

    return HttpResponse(json.dumps({
        "commentID": comment.id,
        "content": content,
        "parentID": parent_id
    }))

def splash(request):
    return render_to_response("splash.html")
