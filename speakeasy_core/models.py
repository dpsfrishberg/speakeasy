from django.contrib import admin
from django.db import models
from speakeasy.threadedcomments import ThreadedComment
from django.contrib.auth.models import User
# Create your models here.

class Article(models.Model):
    slug = models.CharField(max_length=200)
    pass
    def __repr__(self):
        return self.slug
    def __unicode__(self):
        return self.slug
    def __str__(self):
        return self.slug
#body = models.TextField()
    
class Node(models.Model):
    #position = models.IntegerField()
    content = models.TextField()
    article = models.ForeignKey(Article)
    def num_comments(self):
        total = 0
        for comment in SpeakeasyComment.objects.filter(node=self):
            total += 1
            for node in CommentNode.objects.filter(comment=comment):
                total += node.num_comments()
        return total

class ArticleNode(Node):
    pass
    def __repr__(self):
        return self.article.slug + ": " + self.content[:20]
    def __str__(self):
        return self.__repr__()
    def __unicode__(self):
        return self.__repr__()
#    content = models.TextField()

class SpeakeasyComment(models.Model):
    node = models.ForeignKey(Node)
    user = models.ForeignKey(User)
    article = models.ForeignKey(Article)

class CommentNode(Node):
    comment = models.ForeignKey(SpeakeasyComment)
 #   content = models.TextField()

#class SpeakeasyUser(models.Model):
    
