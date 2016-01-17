# Create your views here.
from django.http import HttpResponse
from django.shortcuts import render_to_response, redirect
from speakeasy_core.models import Article

import json

def get_article_id(request):
    url = request.GET.get("url")
    try:
        article = Article.objects.get(url=url)
    except:
        article = Article(url=url)
        article.save()
    return HttpResponse(json.dumps({"id": article.id}))

def splash(request):
    return render_to_response("splash.html")
