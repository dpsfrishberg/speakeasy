from django.conf import settings
from django.contrib import admin
from django.db import models
from django.contrib.auth.models import User
import time
import re

def get_current_timestamp():
    return int(time.time())

class Article(models.Model):
    slug = models.CharField(max_length=200)
    
    @property
    def title(self):
        return re.sub(r'(^\w| \w)', lambda match: match.group(0).upper(), self.slug.replace("_", " "))
    
    def get_subscribers(self):
        return list(set([comment.user for comment in SpeakeasyComment.objects.filter(article=self)]))
        # cast to set and back for uniqueness    
    
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
    updated = models.IntegerField(default=0)

    @property
    def permalink(self):
        return "http://%s/article/%s#%s" % (settings.PROJECT_DOMAIN, self.article.slug, self.id)
    
    def get_ancestors(self):
        ar = []
        node = self
        while True:    
            #parent_node = CommentNode.objects.filter(id=node.comment.node.id)
            parent_node = node.get_parent_node()
            if parent_node is None:
                #node = ArticleNode.objects.filter(id=node.comment.node.id)[0]
                ar.insert(0, {'id': node.id, 'content': node.content_teaser(), 'num_comments': num_comments, 'user': None, 'updated': node.updated})
                break
            else:
                node = parent_node
                try:
                    user = node.comment.user
                    user = {'id': user.id, 'first_name': user.first_name, 'last_name': user.last_name, 'username': user.username}
                except AttributeError:
                    user = None
                
                num_comments = node.num_comments()
                updated = node.updated
                ar.insert(0, {'id': node.id, 'content': node.content_teaser(), 'num_comments': num_comments, 'user': user, 'updated': node.updated})
        return ar
    
    def get_self_and_ancestors(self):
        ar = self.get_ancestors()
        ar.append({"id": self.id, "content": self.content, "num_comments": self.num_comments(), "updated": self.updated})
        return ar
    
    def get_self_and_ancestors_ar(self):
        return [anc["id"] for anc in self.get_self_and_ancestors()]
        """
        nodes = []
        node = self
        while True:
            nodes.append(node)
            node = self.get_parent_node()
            if node is None:
                break
        return nodes
        """
    
    def get_parent_node(self):
        # TODO: Fix this. It breaks inheritance.
        try:
            return self.comment.node
        except AttributeError:
            try:
                node = self.commentnode
                return node.comment.node
            except:
                return None
        except CommentNode.DoesNotExist:
            return None
        
            
    
    def num_comments(self):
        # TODO: Fix this. It breaks inheritance.
        total = 0
        for comment in SpeakeasyComment.objects.filter(node=self):
            total += 1
            for node in CommentNode.objects.filter(comment=comment):
                total += node.num_comments()
        return total
    def content_teaser(self):
        #return self.content
        content = self.content
        teaser = content[0:140]
        if len(teaser) < len(content):
            teaser += "..."
        return teaser
    def save(self, *args, **kwargs):
        if self.updated:
            timestamp = self.updated
        else:
            timestamp = get_current_timestamp()
            self.updated = timestamp
        parent_node = self.get_parent_node()
        super(Node, self).save(*args, **kwargs)
        if parent_node is not None:
            parent_node.updated = timestamp
            parent_node.save()
        
class ArticleNode(Node):
    pass
    def __repr__(self):
        return self.article.slug + ": " + self.content[:20]
    def __str__(self):
        return self.__repr__()
    def __unicode__(self):
        return self.__repr__()
    def get_parent_node(self):
        return None
#    content = models.TextField()

class SpeakeasyComment(models.Model):
    node = models.ForeignKey(Node)
    user = models.ForeignKey(User)
    article = models.ForeignKey(Article)
            
    
class CommentNode(Node):
    comment = models.ForeignKey(SpeakeasyComment)


# Administration
class Domain(models.Model):
    name = models.CharField(max_length=200)
    admins = models.ManyToManyField(User)
    
    @property
    def script(self):
        return "<script type=\"text/javascript\" src=\"//%s/embedded/%s.js\"></script>" % (settings.PROJECT_DOMAIN, self.id)
