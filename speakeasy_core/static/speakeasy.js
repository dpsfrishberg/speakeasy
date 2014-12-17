var vm;
(function($){
    
// Send the CSRF token with each AJAX POST for Django.
function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

var csrftoken = $.cookie("csrftoken");

$.ajaxSetup({
    crossDomain: false,
    beforeSend: function(xhr, settings) {
	if (!csrfSafeMethod(settings.type)) {
	    xhr.setRequestHeader("X-CSRFToken", csrftoken);
	}
    }
    });
    

function comment(comment_id, parent_id, user) {
    var self = this;

    self.comment_id = ko.observable(comment_id);
    //define the properties of a comment
    self.comment_display_id = ko.observable('comment-'+comment_id);
    self.parent_id = ko.observable(parent_id);
    self.user = ko.observable(user);
    self.nodes = ko.observableArray();
    self.speakeasy_type = 'comment';
}

function topeComment(obj) {
    var self = this;
    
    self.obj = obj;
    if (obj.speakeasy_type == 'node' || obj.speakeasy_type == 'breadcrumbNode') {
	self.display_id = ko.observable('tope-comment-'+self.obj.node_id());
	self.display_class = ko.observable('comment item isotope-item tope-comment-breadcrumb');


	self.user = [];
	if (self.obj.user()) {
	    self.user.push(self.obj.user());
	}
	self.nodes = ko.observableArray();
	self.nodes.push(new node(self.obj.node_id(), (self.obj.parent_id ? self.obj.parent_id() : -1), self.obj.content(), self.obj.num_comments(), self.obj.updated()));
    }
    else { //comment
	self.display_id = ko.observable('tope-comment-'+self.obj.comment_id());
	self.display_class = ko.observable('comment item isotope-item tope-comment');
	/*self.content = ko.computed(function(){
		var content = "";
		var nodes = this.obj.nodes();
		for (var i = 0; i < nodes.length; i++) {
		    content += nodes[i].content();
		}
		return content;
		}, self);*/
	
	self.nodes = self.obj.nodes;
	self.user = [self.obj.user];
    }
    
}

var baseNode = function() {
    // TODO: Polling for and updating comment counts should be handled, at least partly, in this class.
    this.init = function() {
	var self = this;
	self.has_new_comments = ko.observable(false);
	self.update_num_comments = function(new_num_comments, notify_if_new) {
	    /*var old_num_comments = self.num_comments();
	    if (new_num_comments > old_num_comments) {
	        self.has_new_comments(true);
	    }*/
	    if (notify_if_new) {
		self.has_new_comments(true);
	    }
	    self.num_comments(new_num_comments);
	};
	self.new_comments_class = ko.computed(function(){
	    return self.has_new_comments() ? 'has-new-comments' : '';
	});
    };
    
};
function node(node_id, parent_id, content, num_comments, updated) {
    this.init.call(this);
    var self = this;
    
    self.node_id = ko.observable(node_id);
    self.node_display_id = ko.observable('node-'+node_id);
    self.node_textarea_id = ko.observable('post-comment-'+node_id);
    self.node_submit_id = ko.observable('post-comment-submit-'+node_id);
    self.content = ko.observable(content);
    self.parent_id = ko.observable(parent_id);
    self.num_comments = ko.observable(num_comments);
    self.updated = ko.observable(updated);
    
        self.node_class = ko.computed(function() {
	if (vm._activeNode()){
		if (vm._activeNode().node_id() == self.node_id()) {
			return 'node active-node';
		}
		else {
			var activeTrail = vm.activeTrail();
			if (!activeTrail) return 'node';
			for (var i in activeTrail) {
				var activeTrailNode = activeTrail[i];
				if (activeTrailNode && (activeTrailNode.node_id() == self.node_id())) {
					return 'node active-node';
				}
			}
		}
	}
	return 'node';
    });
    self.speakeasy_type = 'node';
}
node.prototype = new baseNode();
node.prototype.constructor = node;

function breadcrumbNode(node_id, content, num_comments, user, updated) {
    this.init.call(this);
    var self = this;
        
    self.node_id = ko.observable(node_id);
    self.node_display_id = ko.observable('node-'+node_id);
    self.node_textarea_id = ko.observable('post-comment-'+node_id);
    self.node_submit_id = ko.observable('post-comment-submit-'+node_id);
    self.num_comments = ko.observable(num_comments);
    self.content = ko.observable(content);
    self.speakeasy_type = 'breadcrumbNode';
    if (!user) user = null;
    self.user = ko.observable(user);
    self.updated = ko.observable(updated);
    
    self.active_class = ko.computed(function() {
        // TODO: Move to baseNode
        if (vm._activeNode()) {
            if (vm._activeNode().node_id() == self.node_id()) {
                    return 'active';
            }
            else {
                    var activeTrail = vm.activeTrail();
                    if (!activeTrail) return '';
                    for (var i in activeTrail) {
                            var activeTrailNode = activeTrail[i];
                            if (activeTrailNode && self.node_id() && (activeTrailNode.node_id() == self.node_id())) {
                                    return 'active';
                            }
                    }
            }
        }
        return '';
        }
    );


}
breadcrumbNode.prototype = new baseNode();
breadcrumbNode.prototype.constructor = breadcrumbNode;


function viewModel() {
    //Step 2 and so on below
    var self = this;

    self.articleNodes = ko.observableArray();

    self.loadArticleNodes = function () {
	$.getJSON('/article/'+article_slug+'/article-nodes.json', function(data){
		for (var node_id in data) {
			var articleNode = new node(node_id, 0, data[node_id].content, data[node_id].num_comments, data[node_id].updated);
			self.articleNodes.push(articleNode);
		}
	});
    };
    self._activeNode = null;
    
    self.loadCommentsForNode = function (node_id) {
	$.ajax({url: '/article/'+article_slug+'/node-comments.json', data: {node_id: node_id}, dataType: 'json',
	       success: function(data) {
		self.activeComments.removeAll();
		//self.activeNodeComments.removeAll();
		for (var comment_id in data) {
			var nodeComment = new comment(comment_id, data[comment_id].parent_id, data[comment_id].user);
			for (var node_id in data[comment_id].nodes) {
				var commentNode = new node(node_id, comment_id, data[comment_id].nodes[node_id].content, data[comment_id].nodes[node_id].num_comments, data[comment_id].nodes[node_id].updated);
				nodeComment.nodes.push(commentNode);
			}
			self.activeComments.push(nodeComment);
			self.activeNodeComments.push(new topeComment(nodeComment));

		}
	},
	async: false});
    };
    
    self.loadBreadcrumbForNode = function (node_id) {
	$.ajax({url: '/article/'+article_slug+'/node-ancestors.json', data: {node_id: node_id}, success: function(data){
		self.activeTrail.removeAll();
		$('.comments-in-isotope').each(function(){$(this).isotope( 'reLayout', function(){});});
		//self.activeNodeComments.removeAll();
		var ancestors = data.ancestors;
		for (var i = 0; i < ancestors.length; i++){
			var newBreadcrumbNode = new breadcrumbNode(ancestors[i].id, ancestors[i].content, ancestors[i].num_comments, ancestors[i].user, ancestors[i].updated);
			self.activeTrail.push(newBreadcrumbNode);
			var newTC = new topeComment(newBreadcrumbNode);
                        self.activeNodeComments.push(newTC);
		}
		if (data['node']) {
			var activeNode = data['node'];
			var activeBreadcrumbNode = new breadcrumbNode(activeNode.id, activeNode.content, activeNode.num_comments, activeNode.user, activeNode.updated);
			//self.activeTrail.push(activeBreadcrumbNode);
			self._activeNode(activeBreadcrumbNode);
                        self.activeTrail.push(activeBreadcrumbNode);
			self.activeNodeTextareaId = activeBreadcrumbNode.node_textarea_id();
			self.activeNodeSubmitId = activeBreadcrumbNode.node_submit_id();
			var activeTC = new topeComment(activeBreadcrumbNode);
			activeTC.display_class(activeTC.display_class() + " active");
			self.activeNodeComments.push(activeTC);
		}
		},
		dataType: 'json',
		async: false});
    };
    
    
    self.setActiveNode = function(node_id) {
	vm.activeNodeComments.removeAll();
	vm.loadBreadcrumbForNode(node_id);
	vm.loadCommentsForNode(node_id);
        console.info(node_id);
        window.location.hash = node_id;
}
    
    self.pollForComments = function(){
      var self = this;
      setTimeout(function(){
	    // Go to the server and ask for the full list of comments, structured as an object
	    //  of each IDs pointing to its parent node id, the user who authored the comment,
	    //  and an object of child nodes, each with a number of comments.
	  $.ajax({ url: "/article/"+article_slug+"/check-comments.json", success: function(data){
	    // Loop through the comment IDs. Find any whose parent node is the active node.
	    //  If the comment does not exist in the active node's comments:
	    //  Add it, and insert its child nodes.
	    // TODO: This won't handle modified, removed, or added child nodes of existing comments. Fix that.
	    // TODO: Allow this to tell each node whether it should have a red flag (if new comments were added).
	    for (var comment_id in data) {
		    var dataComment = data[comment_id];
		    if (!self._activeNode()) break;
		    if (dataComment.node_id == self._activeNode().node_id()) {
			    // TODO: Make this search a function: var found = isCommentActive(comment_id)
			    var found = false;
			    for (var i in self.activeComments()) {
				    var activeComment = self.activeComments()[i];
				    if (activeComment.comment_id() == comment_id) {
					    found = true;
					    break;
				    }
			    }
		    
			    if (found) {
				
			    }
			    else {
				var newComment = new comment(comment_id, dataComment.node_id, dataComment.user);
				for (var node_id in dataComment.nodes) {
				    var commentNode = new node(node_id, comment_id, dataComment.nodes[node_id].content, dataComment.nodes[node_id].num_comments, dataComment.nodes[node_id].updated);
				    newComment.nodes.push(commentNode);
				}
				self.activeComments.push(newComment);
				self.activeNodeComments.push(new topeComment(newComment));
			    }
		    }
		    /*else if (self._nodeInActiveTrail(dataComment.node_id)) {
			var oldComment = self._getExistingComment()
		    }*/
	    }
	    
	    //self.updateNodeCommentCounts();
	    self.getNodeCountChanges();
    
	    //Setup the next poll recursively
	    self.pollForComments();
	  }, dataType: "json"});
	

	    }, 3000);
      };
    
    
    self.updateNodeFromChangesById = function(node_id, timestamp, num_comments, notifyIfNew) {
	self.nodesEachById(node_id, function(theNode) {
	     // Only notify if not on the first update.
	     // Check against when theNode was updated, because it might be a comment node that was just posted.
	     var notify = false;
	     if (notifyIfNew && self._lastUpdatedTimestamp !== 0 && timestamp > theNode.updated()) {
		notify = true;
	     }
		 theNode.update_num_comments(num_comments, notify);
		 theNode.updated(timestamp);
	     
	});

    };
    
    self.updateNodesFromChanges = function(nodes, timestamp) {
	for (var node_id in nodes) {
	    self.updateNodeFromChangesById(node_id, nodes[node_id].updated, nodes[node_id].num_comments, true);
	}
	self._lastUpdatedTimestamp = timestamp;

    };
    self.getNodeCountChanges = function() {
	$.ajax({url: "/article/"+article_slug+"/"+self._lastUpdatedTimestamp+"/get-node-changes.json?" + Math.random(),
	       success: function(data){
		eval(data);
		self.updateNodesFromChanges(data["nodes"], data["timestamp"]);
	       }
	    });
    };
    

    self.nodesEachById = function(node_id, node_func) {
	applyFuncToNodes = function(nodes) {
	    for (var i in nodes) {
		var theNode = nodes[i];
		if (typeof theNode !== "undefined" && theNode.node_id() == node_id) {
			node_func(theNode);
		}
    	    }
	};
	applyFuncToNodes(self.articleNodes());
	applyFuncToNodes(self.activeTrail());
	//applyFuncToNodes(jQuery.map(self.activeNodeComments(), function(tc) {return tc.nodes();}));
        applyFuncToNodes(jQuery.map(self.activeComments(), function(comm) {return comm.nodes();}));
        applyFuncToNodes([self._activeNode()]);
    };
    
    self.commentAdded = function(el) {
	var $cont = el.closest(".comments-in-isotope");
	$cont.isotope( 'appended', $(el) );
    };
    
    self.showBreadcrumb = function() {
	$("html").addClass("inactive");
	$("#breadcrumb").removeClass("inactive");
    };
    
    self.hideBreadcrumb = function() {
	$("#breadcrumb").addClass("inactive");
	$("html").removeClass("inactive");
    }
    
    self.breadcrumbIsShown = function() {
        
        var ret = !($("#breadcrumb").hasClass("inactive"));
        return ret;
    };
    
    self.activeNodeTextareaId = ko.observable();
    self.activeNodeSubmitId = ko.observable();
    
    self.activeComments = ko.observableArray();
    self.activeNodeComments = ko.observableArray();
    
    self.activeTrail = ko.observableArray();
    
    self._activeNode = ko.observable();
    
    
    self.loadArticleNodes();
        self.pollForComments();

    self._lastUpdatedTimestamp = 0;
};


$(function() {
	$(document).on('click', 'input[type=submit]', function(e){
			var content = jQuery.trim($(e.target).closest('.comment-submit-form').find('textarea').val());
			if (!content) {
			    if (e.preventDefault) e.preventDefault();
			    return false;
			}
			$.ajax({url: '/article/'+article_slug+'/post-comment.json',
			       data: {'node_id': $(e.target).attr('name').replace(/post-comment-submit-/, ''),
						'content': content,
						'last_updated': vm._lastUpdatedTimestamp},
			       success: function(data, textStatus, jqXHR) {
				    var comments = data["comments"];
					for (var comment_id in comments) {
						var dataComment = comments[comment_id];
						var newComment = new comment(comment_id, dataComment.node_id, dataComment.user);
						for (var node_id in dataComment.nodes) {
							newComment.nodes.push(new node(node_id, comment_id, dataComment.nodes[node_id].content, dataComment.nodes[node_id].num_comments, dataComment.nodes[node_id].updated));
							vm.updateNodeFromChangesById(node_id, dataComment.nodes[node_id].updated, dataComment.nodes[node_id].num_comments, false);
							var ancestors = dataComment.nodes[node_id].ancestors;
							for (var i = 0; i < ancestors.length; i++){
							    vm.updateNodeFromChangesById(ancestors[i].id, ancestors[i].updated, ancestors[i].num_comments, false);
							}
						}
						vm.activeComments.push(newComment);
						vm.activeNodeComments.push(new topeComment(newComment));
						
					}
					//vm.updateNodesFromChanges(data["new_nodes"], data["timestamp"]);
				},
				type: 'post',
				error: function(jqXHR, textStatus, errorThrown) {console.info(errorThrown)},
				dataType: 'json',
				async: false // Make this async so we can do the update-handling first.
				});
			
			if (e.preventDefault) e.preventDefault();
			return false;
		});
	
	$(document).on('click', '.node, .breadcrumb-node', function(e) {
			vm.showBreadcrumb();
			var $button = $(e.target);
			if (!$button.hasClass('node-button-open')) {
				var $node = $button.closest('.node, .breadcrumb-node');
				var node_id = $node.attr('id').replace('node-', '');
				vm.setActiveNode(node_id);
			}
                        e.stopPropagation();
		});
	
	$(document).on('click touchstart', '#breadcrumb, body', function(e) {
		//if (e.currentTarget != e.delegateTarget) return;
                if (vm.breadcrumbIsShown() && ($(e.target).is("#breadcrumb") || $(e.target).parents("#breadcrumb").length == 0)) {
                    vm.hideBreadcrumb();
                }
	});
});

function goToCommentFromHash() {
    var nodeId = window.location.hash || null;
    nodeId = nodeId ? nodeId.replace(/^#/, "") : null;
    console.info(nodeId);
    if (nodeId === null || nodeId === "" || (vm._activeNode() && vm._activeNode().node_id() == nodeId)) {
        return;
    }
    console.info("continuing");
    vm.showBreadcrumb();
    if (nodeId) {
        vm.loadBreadcrumbForNode(nodeId);
    }
}

$(window).on("hashchange", goToCommentFromHash);

$(function() {
//Step 1
vm = new viewModel();


//Step 3
ko.applyBindings(vm);
$('.comments-in-isotope').each(function(){$(this).isotope({
	animationOptions: {
     duration: 750,
     easing: 'linear',
     queue: false
   }
});});

goToCommentFromHash();
});

/*
    Notes: 
    -To get the actual value out of the object call whatever.id() because whaterver.id is a function, id() gets the actual value 
    -http://knockoutjs.com/documentation/introduction.html

*/


})(jQuery);
