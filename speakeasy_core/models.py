from django.db import models

class Article(models.Model):
    url = models.CharField(max_length=200)
    
class Node(models.Model):
    article = models.ForeignKey(Article)
    text = models.TextField()
    updated = models.IntegerField(default=0)
    parent = models.ForeignKey("Node", null=True)
    xpath = models.CharField(max_length=200)
    offset = models.IntegerField(default=-1)