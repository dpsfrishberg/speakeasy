from django.db import models

class Article(models.Model):
    url = models.CharField(max_length=200)
    

