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

//////// Prototypes & Constructors //////////
    
function SpeakeasyNode(nodeID, parentComment, content, comments) {
    var self = this;
    self.nodeID = ko.observable(nodeID);
    self.parentComment = ko.observable(parentComment);
    self.parentNode = ko.computed(function() {
        console.info(self.parentComment());
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
        var comments = self.comments();
        for (var i = 0; i < comments.length; i++) {
            var comment = comments[i];
            if (comment.isNew()) {
                return true;
            }
            if (comment.hasNewComments()) {
                return true;
            }
        }
        return false;
    }, self);
    
    self.clearNewComments = function(){
        var comments = self.comments();
        for (var i = 0; i < comments.length; i++) {
            var comment = comments[i];
            comment.isNew(false);
        }
    };
    
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
                self.comments.push(new SpeakeasyComment(commentID, self, comments[commentID].user, comments[commentID].nodes, true));
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

function SpeakeasyComment(commentID, parentNode, user, nodes, isNew) {
    if (typeof isNew === "undefined") {
        isNew = false;
    }
    var self = this;
    self.commentID = ko.observable(commentID);
    self.parentNode = ko.observable(parentNode);
    self.user = ko.observable(new SpeakeasyUser(user.id, user.firstName, user.lastName));
    self.nodes = ko.observableArray();
    self.isNew = ko.observable(isNew);
    
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
    
    self.hasNewComments = ko.computed(function() {
        var nodes = self.nodes();
        var hasNewComments = false;
        nodes.forEach(function(node) {
            if (node.hasNewComments()) {
                hasNewComments = true;
            }
        });
        return hasNewComments;
    });
    
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

///////// Main viewModel ///////////////
function viewModel() {
    //Step 2 and so on below
    var self = this;

    self.articleNodes = ko.observableArray();

    var loadingTree = $.getJSON('/article/'+articleSlug+'/tree.json', function(data) {
            var tree = data.tree;
            self._lastUpdated = data.lastUpdated;
            for (var nodeID in tree) {
                var node = tree[nodeID];
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
        node.clearNewComments();
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
    
    self.hasNode = function(nodeID) {
        var nodes = self.articleNodes();
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeID() == nodeID) {
                return true;
            }
        }
        return false;
    };
    
    self.getNode = function(nodeID) {
        var nodes = self.articleNodes();
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeID() == nodeID) {
                return nodes[i];
            }
        }
        return null;
    }
    
    self.parentNode = function() {
        return null;
    }
    
    self.update = function(nodes) {
        for (var nodeID in nodes) {
            if (self.hasNode(nodeID)) {
                self.getNode(nodeID).update(nodes[nodeID].comments);
            }
            else {
                self.articleNodes.push(new SpeakeasyNode(nodeID, self, nodes[nodeID].content, nodes[nodeID].comments));
            }
        }

    };

    self._lastUpdated = 0;
};

//////////// Event Handlers /////////////////////
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
			       success: function(data, textStatus, jqXHR) {},
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

//////////////// Initialization /////////////////

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
    $.ajax({url: "/article/"+articleSlug+"/tree.json",
           data: {
               lastUpdated: vm._lastUpdated
           },
           success: function(data, textStatus, jqXHR) {
               vm._lastUpdated = data.lastUpdated;
               vm.update(data.tree);
           },
           error: function(jqXHR, textStatus, errorThrown) {
            console.info(errorThrown);
           },
           dataType: "json",
           type: "get"})
    setTimeout(pollForComments, 3000);
})();

});



/*
    Notes: 
    -To get the actual value out of the object call whatever.id() because whaterver.id is a function, id() gets the actual value 
    -http://knockoutjs.com/documentation/introduction.html

*/


})(jQuery);
