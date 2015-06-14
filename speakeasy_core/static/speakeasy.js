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
    
function SpeakeasyNode(nodeID, parentComment, content, comments) {
    var self = this;
    self.nodeID = ko.observable(nodeID);
    self.parentComment = ko.observable(parentComment);
    self.parentNode = ko.computed(function() {
        if (self.parentComment() !== null) {
            return self.parentComment().parentNode();
        }
        else {
            return null;
        }
    }, self);
    self.content = ko.observable(content);
    
    self.comments = ko.observableArray();
    for (var commentID in comments) {
        var comment = comments[commentID];
        self.comments.push(new SpeakeasyComment(commentID, self, comment.user, comment.nodes));
    }
    
    self.isActive = ko.computed(function() {
        return vm._activeNode() === self;
    }, self);
    
    self.hasNewComments = ko.computed(function() {
        return false;
    }, self);
    
    self.numComments = ko.computed(function() {
        var comments = self.comments();
        var num = 0;
        num += comments.length;
        comments.forEach(function(comment) {    
            num += comment.numComments();
        });
    
        return num;
    }, self);
    
    self.hasComment = function(commentID) {
        var comments = self.comments();
        for (var i = 0; i < comments.length; i++) {
            if (comments[i].commentID() == commentID) {
                return true;
            }
        }
        return false;
    };
    
    self.getComment = function(commentID) {
        var comments = self.comments();
        for (var i = 0; i < comments.length; i++) {
            if (comments[i].commentID() == commentID) {
                return comments[i];
            }
        }
        return null;
    };
    
    self.update = function(comments) {
        for (var commentID in comments) {
            if (self.hasComment(commentID)) {
                self.getComment(commentID).update(comments[commentID].nodes);
            }
            else {
                self.comments.push(new SpeakeasyComment(commentID, self, comments[commentID].user, comments[commentID].nodes))
            }
        }
    };
}

function SpeakeasyUser(userID, firstName, lastName) {
    var self = this;
    self.id = ko.observable(userID);
    self.firstName = ko.observable(firstName);
    self.lastName = ko.observable(lastName);
    self.name = ko.computed(function(){
        return self.firstName() + " " + self.lastName();
    });
}

function SpeakeasyComment(commentID, parentNode, user, nodes) {
    var self = this;
    self.commentID = ko.observable(commentID);
    self.parentNode = ko.observable(parentNode);
    self.user = ko.observable(new SpeakeasyUser(user.id, user.firstName, user.lastName));
    self.nodes = ko.observableArray();
    
    for (var nodeID in nodes) {
        var node = nodes[nodeID];
        self.nodes.push(new SpeakeasyNode(nodeID, self, node.content, node.comments));
    }
    
    self.numComments = ko.computed(function() {
        var nodes = self.nodes();
        var num = 0;
        nodes.forEach(function(node) {
            num += node.numComments();
        });
        return num;    
    }, self);
    
    self.hasNode = function(nodeID) {
        var nodes = self.nodes();
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeID() == nodeID) {
                return true;
            }
        }
        return false;
    }

    self.getNode = function(nodeID) {
        var nodes = self.nodes();
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeID() == nodeID) {
                return nodes[i];
            }
        }
        return null;
    }
    
    self.update = function(nodes){
        for (var nodeID in nodes) {
            if (self.hasNode(nodeID)) {
                self.getNode(nodeID).update(nodes[nodeID].comments);
            }
            else {
                self.nodes.push(new SpeakeasyNode(nodeID, self, nodes[nodeID].content, nodes[nodeID].comments));
            }
        }
    };
}

function viewModel() {
    //Step 2 and so on below
    var self = this;

    self.articleNodes = ko.observableArray();

    var loadingTree = $.getJSON('/article/'+articleSlug+'/tree.json', function(data) {
            for (var nodeID in data) {
                var node = data[nodeID];
                self.articleNodes.push(new SpeakeasyNode(nodeID, null, node.content, node.comments));
            }
        });
    
    self.getNodeByID = function(nodeID) {
        return (function getNode(nodes) {
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                if (node.nodeID() == nodeID) {
                    return node;
                }
                else {
                    var comments = node.comments();
                    for (var j = 0; j < comments.length; j++) {
                        var comment = comments[j];
                        var node = getNode(comment.nodes());
                        if (node) {
                            return node;
                        }
                        
                    }
                }
            }
            return null;
        })(self.articleNodes());
    };
    self._activeNode = ko.observable();

    self.setActiveNode = function(nodeID) {
        loadingTree.complete(function(){
            
	var node = vm.getNodeByID(nodeID);
        self._activeNode(node);
        window.location.hash = nodeID;
        });
    }
    self.clearActiveNode = function(nodeID) {
        self._activeNode(undefined);
    };

    self.activeTrail = ko.computed(function(){
        var activeNode = this._activeNode();
        return (activeNode) ? (function getActiveTrail(node) {
            if (node === null) {
                return [];
            }
            var trail = getActiveTrail(node.parentNode());
            trail.push(node);
            console.info(trail);
            return trail;
        })(activeNode) : [];
    }, self);
        
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
    
    self.activeNodeComments = ko.computed(function(){
        return self._activeNode() ? self._activeNode().comments() : [];
    });

    self._lastUpdated = 0;


    /*
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
	// TODO: Why Math.random()?
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
    
    
    
    
    self.activeNodeTextareaId = ko.observable();
    self.activeNodeSubmitId = ko.observable();
    
    self.activeComments = ko.observableArray();
    self.activeNodeComments = ko.observableArray();
    
    self.activeTrail = ko.observableArray();
    */
    //self.pollForComments();

    //self._lastUpdatedTimestamp = 0;
};


$(function() {
	$(document).on('submit', '#comment-submit-form', function(e){
                        e.preventDefault();
                        var content = jQuery.trim($('#response').val());
			if (!content) {
			    return false;
			}
                        var activeNode = vm._activeNode();
			$.ajax({url: '/article/'+articleSlug+'/post-comment.json',
			       data: {'node_id': activeNode.nodeID(),
						'content': content,
						'last_updated': vm._lastUpdated},
			       success: function(data, textStatus, jqXHR) {
				    var comments = data["comments"];
                                    activeNode.comments([]);
                                    
					for (var commentID in comments) {
						var dataComment = comments[commentID];
                                                activeNode.comments.push(new SpeakeasyComment(commentID, activeNode, dataComment.user, dataComment.nodes));
						/*for (var node_ID in dataComment.nodes) {
							newComment.nodes.push(new node(node_id, comment_id, dataComment.nodes[node_id].content, dataComment.nodes[node_id].num_comments, dataComment.nodes[node_id].updated));
							vm.updateNodeFromChangesById(node_id, dataComment.nodes[node_id].updated, dataComment.nodes[node_id].num_comments, false);
							var ancestors = dataComment.nodes[node_id].ancestors;
							for (var i = 0; i < ancestors.length; i++){
							    vm.updateNodeFromChangesById(ancestors[i].id, ancestors[i].updated, ancestors[i].num_comments, false);
							}
						}*/
						//vm.activeComments.push(newComment);
						//vm.activeNodeComments.push(new topeComment(newComment));
						
					}
					//vm.updateNodesFromChanges(data["new_nodes"], data["timestamp"]);
				},
				type: 'post',
				error: function(jqXHR, textStatus, errorThrown) {console.info(errorThrown)},
				dataType: 'json',
				async: false // Make this async so we can do the update-handling first.
				});
                        
			return false;
		});
	
	$(document).on('click', '.node, .breadcrumb-node', function(e) {
			vm.setActiveNode($(e.target).closest('.node, .breadcrumb-node').attr('id').replace('node-', ''));
			vm.showBreadcrumb();
			e.preventDefault();
                        e.stopPropagation();
                        
		});
	
	$(document).on('click touchstart', '#breadcrumb, body', function(e) {
                if (vm.breadcrumbIsShown() && ($(e.target).is("#breadcrumb") || $(e.target).parents("#breadcrumb").length == 0)) {
                    vm.hideBreadcrumb();
                    vm.clearActiveNode();
                    window.location.hash = "";
                }
	});
});



$(function() {
//Step 1
vm = new viewModel();


//Step 3
ko.applyBindings(vm);

$("#breadcrumb-trail .node").each(
    function(){
        $(this).isotope({
            animationOptions: {
                duration: 750,
                easing: "linear",
                queue: false
            }
        });
    }
);
function goToCommentFromHash() {
    var nodeID = window.location.hash || null;
    nodeID = nodeID ? nodeID.replace(/^#/, "") : null;
    console.info(nodeID);
    if (nodeID === null || nodeID === "" || (vm._activeNode() && vm._activeNode().nodeID() == nodeID)) {
        return;
    }
    console.info("continuing");
    if (nodeID) {
        vm.setActiveNode(nodeID);
    }
    vm.showBreadcrumb();
}
$(window).on("hashchange", goToCommentFromHash);


(function pollForComments(){
    $.ajax({url: "/article/"+articleSlug+"/new-comments.json",
           data: {
               lastUpdated: vm._lastUpdated
           },
           success: function(data, textStatus, jqXHR) {
               vm._lastUpdated = data.lastUpdated;
               console.info(data);
           },
           error: function(jqXHR, textStatus, errorThrown) {
            console.info(errorThrown);
           },
           dataType: "json",
           type: "get"})
})();

});



/*
    Notes: 
    -To get the actual value out of the object call whatever.id() because whaterver.id is a function, id() gets the actual value 
    -http://knockoutjs.com/documentation/introduction.html

*/


})(jQuery);
