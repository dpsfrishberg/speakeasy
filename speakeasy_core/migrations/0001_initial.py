# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Article'
        db.create_table(u'speakeasy_core_article', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('url', self.gf('django.db.models.fields.CharField')(max_length=200)),
        ))
        db.send_create_signal(u'speakeasy_core', ['Article'])

        # Adding model 'Node'
        db.create_table(u'speakeasy_core_node', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('article', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['speakeasy_core.Article'])),
            ('text', self.gf('django.db.models.fields.TextField')()),
            ('updated', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('parent', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['speakeasy_core.Node'], null=True)),
            ('xpath', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('offset', self.gf('django.db.models.fields.IntegerField')(default=-1)),
        ))
        db.send_create_signal(u'speakeasy_core', ['Node'])


    def backwards(self, orm):
        # Deleting model 'Article'
        db.delete_table(u'speakeasy_core_article')

        # Deleting model 'Node'
        db.delete_table(u'speakeasy_core_node')


    models = {
        u'speakeasy_core.article': {
            'Meta': {'object_name': 'Article'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'url': ('django.db.models.fields.CharField', [], {'max_length': '200'})
        },
        u'speakeasy_core.node': {
            'Meta': {'object_name': 'Node'},
            'article': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['speakeasy_core.Article']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'offset': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['speakeasy_core.Node']", 'null': 'True'}),
            'text': ('django.db.models.fields.TextField', [], {}),
            'updated': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'xpath': ('django.db.models.fields.CharField', [], {'max_length': '200'})
        }
    }

    complete_apps = ['speakeasy_core']