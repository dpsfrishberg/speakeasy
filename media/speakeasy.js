var vm;
(function($){
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
	self.nodes.push(new node(self.obj.node_id(), (self.obj.parent_id ? self.obj.parent_id() : -1), self.obj.content(), self.obj.num_comments()));
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

function node(node_id, parent_id, content, num_comments) {
    var self = this;
    
    self.node_id = ko.observable(node_id);
    self.node_display_id = ko.observable('node-'+node_id);
    self.node_textarea_id = ko.observable('post-comment-'+node_id);
    self.node_submit_id = ko.observable('post-comment-submit-'+node_id);
    self.content = ko.observable(content);
    self.parent_id = ko.observable(parent_id);
    self.num_comments = ko.observable(num_comments);
    
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

function breadcrumbNode(node_id, content, num_comments, user) {
    var self = this;
    self.node_id = ko.observable(node_id);
    self.node_display_id = ko.observable('node-'+node_id);
    self.node_textarea_id = ko.observable('post-comment-'+node_id);
    self.node_submit_id = ko.observable('post-comment-submit-'+node_id);
    self.num_comments = ko.observable(num_comments);
    self.content = ko.observable(content);
    self.speakeasy_type = 'breadcrumbNode';
    if (!user) user = null;
    self.user = ko.observable(user)
}

function viewModel() {
    //Step 2 and so on below
    var self = this;

    self.articleNodes = ko.observableArray();

    self.loadArticleNodes = function () {
	$.getJSON('/article/'+article_slug+'/article-nodes.json', function(data){
		for (var node_id in data) {
			var articleNode = new node(node_id, 0, data[node_id].content, data[node_id].num_comments);
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
				var commentNode = new node(node_id, comment_id, data[comment_id].nodes[node_id].content, data[comment_id].nodes[node_id].num_comments);
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
		$('#comments-in-isotope').isotope( 'reLayout', function(){});
		//self.activeNodeComments.removeAll();
		var ancestors = data.ancestors;
		for (var i = 0; i < ancestors.length; i++){
			var newBreadcrumbNode = new breadcrumbNode(ancestors[i].id, ancestors[i].content, ancestors[i].num_comments, ancestors[i].user);
			self.activeTrail.push(newBreadcrumbNode);
			var newTC = new topeComment(newBreadcrumbNode);
                        self.activeNodeComments.push(newTC);
		}
		if (data['node']) {
			var activeNode = data['node'];
			var activeBreadcrumbNode = new breadcrumbNode(activeNode.id, activeNode.content, activeNode.num_comments, activeNode.user);
			//self.activeTrail.push(activeBreadcrumbNode);
			self._activeNode(activeBreadcrumbNode);
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
}
    
    self.pollForComments = function(){
      var self = this;
      setTimeout(function(){
      $.ajax({ url: "/article/"+article_slug+"/check-comments.json", success: function(data){
	for (var comment_id in data) {
		var dataComment = data[comment_id];
		if (!self._activeNode()) break;
		if (dataComment.node_id == self._activeNode().node_id()) {
			var found = false;
			for (var i in self.activeComments()) {
				var activeComment = self.activeComments()[i];
				if (activeComment.comment_id() == comment_id) {
					found = true;
					break;
				}
			}
		
			if (found) continue;
			var newComment = new comment(comment_id, dataComment.node_id, dataComment.user);
			for (var node_id in dataComment.nodes) {
				var commentNode = new node(node_id, comment_id, dataComment.nodes[node_id].content, dataComment.nodes[node_id].num_comments);
				newComment.nodes.push(commentNode);
			}
			self.activeComments.push(newComment);
			self.activeNodeComments.push(new topeComment(newComment));

		}			
	}
	
	self.updateNodeCommentCounts();
	

	//Setup the next poll recursively
	self.pollForComments();
      }, dataType: "json"});
	}, 3000);
    };
    
    self.updateNodeCommentCounts = function() {
	$.ajax({url: "/article/"+article_slug+"/get-node-comment-counts.json",
	       success: function(data){
		var nums_comments = {};
		eval(data);
			for (var node_id in nums_comments) {
				self.nodesEachById(node_id, function(theNode) {
				    theNode.num_comments(nums_comments[node_id]['num_comments']);
				});
			}
		}
	});
    };
    

    self.nodesEachById = function(node_id, node_func) {
	applyFuncToNodes = function(nodes) {
	    for (var i in nodes) {
		var theNode = nodes[i];
		if (theNode.node_id() == node_id) {
			node_func(theNode);
		}
    	    }
	};
	applyFuncToNodes(self.articleNodes());
	applyFuncToNodes(self.activeTrail());
    };
    
    self.commentAdded = function(el) {
	
	$('#comments-in-isotope').isotope( 'appended', $(el) );
    };
    
    self.showBreadcrumb = function() {
	$("html").addClass("inactive");
	$("#breadcrumb").removeClass("inactive");
    };
    
    self.hideBreadcrumb = function() {
	$("#breadcrumb").addClass("inactive");
	$("html").removeClass("inactive");
    }
    
    self.activeNodeTextareaId = ko.observable();
    self.activeNodeSubmitId = ko.observable();
    
    self.activeComments = ko.observableArray();
    self.activeNodeComments = ko.observableArray();
    
    self.activeTrail = ko.observableArray();
    
    self._activeNode = ko.observable();
    
    
    self.loadArticleNodes();
        self.pollForComments();

    
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
						'content': content},
			       success: function(data, textStatus, jqXHR) {
					for (var comment_id in data) {
						var dataComment = data[comment_id];
						var newComment = new comment(comment_id, dataComment.node_id, dataComment.user);
						for (var node_id in dataComment.nodes) {
							newComment.nodes.push(new node(node_id, comment_id, dataComment.nodes[node_id].content, dataComment.nodes[node_id].num_comments));
						}
						vm.activeComments.push(newComment);
						vm.activeNodeComments.push(new topeComment(newComment));
					}
				},
				type: 'post',
				error: function(jqXHR, textStatus, errorThrown) {console.info(errorThrown)},
				dataType: 'json'});
			
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
		});
	
	$(document).on('click', '#breadcrumb', function(e) {
		if (e.target != $('#breadcrumb').get(0)) return;
		console.info("foo");
		console.info(e);
		vm.hideBreadcrumb();
	});
});


$(function() {
//Step 1
vm = new viewModel();


//Step 3
ko.applyBindings(vm);
$('#comments-in-isotope').isotope({
	animationOptions: {
     duration: 750,
     easing: 'linear',
     queue: false
   }
});
});
//I can explain this all this weekend

/*
    Notes: 
    -To get the actual value out of the object call whatever.id() because whaterver.id is a function, id() gets the actual value 
    -http://knockoutjs.com/documentation/introduction.html

*/


})(jQuery);
