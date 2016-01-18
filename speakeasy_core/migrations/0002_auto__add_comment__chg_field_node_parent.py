# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Comment'
        db.create_table(u'speakeasy_core_comment', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('article', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['speakeasy_core.Article'])),
            ('content', self.gf('django.db.models.fields.TextField')()),
            ('updated', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('parent', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['speakeasy_core.Node'])),
        ))
        db.send_create_signal(u'speakeasy_core', ['Comment'])


        # Changing field 'Node.parent'
        db.alter_column(u'speakeasy_core_node', 'parent_id', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['speakeasy_core.Comment'], null=True))

    def backwards(self, orm):
        # Deleting model 'Comment'
        db.delete_table(u'speakeasy_core_comment')


        # Changing field 'Node.parent'
        db.alter_column(u'speakeasy_core_node', 'parent_id', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['speakeasy_core.Node'], null=True))

    models = {
        u'speakeasy_core.article': {
            'Meta': {'object_name': 'Article'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'url': ('django.db.models.fields.CharField', [], {'max_length': '200'})
        },
        u'speakeasy_core.comment': {
            'Meta': {'object_name': 'Comment'},
            'article': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['speakeasy_core.Article']"}),
            'content': ('django.db.models.fields.TextField', [], {}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['speakeasy_core.Node']"}),
            'updated': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        u'speakeasy_core.node': {
            'Meta': {'object_name': 'Node'},
            'article': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['speakeasy_core.Article']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'offset': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['speakeasy_core.Comment']", 'null': 'True'}),
            'text': ('django.db.models.fields.TextField', [], {}),
            'updated': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'xpath': ('django.db.models.fields.CharField', [], {'max_length': '200'})
        }
    }

    complete_apps = ['speakeasy_core']