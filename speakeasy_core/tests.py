"""
This file demonstrates two different styles of tests (one doctest and one
unittest). These will both pass when you run "manage.py test".

Replace these with more appropriate tests for your application.
"""
from django.test import TestCase


from selenium import webdriver
from django.test import LiveServerTestCase, TestCase
from robotpageobjects import Page


class ArticlePage(Page):
    uri = "/article/{slug}"
    selectors = {
        "node": "css=.article > #nodes > .node"
    }
    
class SpeakeasyTestCase(LiveServerTestCase):
    fixtures = ["auth",  "speakeasy_core"]
    def setUp(self):
        self.page = ArticlePage();
        self.page.baseurl = self.live_server_url
        self.page.open("%s/article/lipsum" % self.live_server_url)
    
    def test_article_nodes_are_loaded(self):
        page = self.page
        self.assertEqual(len(page.find_elements("node")), 7)
        
    def tearDown(self):
        self.page.close()


class SimpleTest(TestCase):
    def test_basic_addition(self):
        """
        Tests that 1 + 1 always equals 2.
        """
        self.failUnlessEqual(1 + 1, 2)

__test__ = {"doctest": """
Another way to test that 1 + 1 is equal to 2.

>>> 1 + 1 == 2
True
"""}

