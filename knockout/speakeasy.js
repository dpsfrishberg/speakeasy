/// <reference path="knockout-2.1.0.js" />

//(function ($) {
//	var init_comments_conts = function(){
//		$('.node').each(
//			function(){
//				var $node = $(this);
//				var id = $node.attr('id');
//				$node.append('<span class="comments-wrapper"><div class="comments"></div><div class="comments-reply"><textarea id="comments-reply-"'+id+'name="comments-reply-"'+id+'"/></div></span>');
//			}
//		);
//	};
	
//	var load_comments = function(){
//		$.get('comments.json', function(data, status, jq_xhr){
//			var comments = JSON.parse(data);
//			for (var i = 0; i < comments.length; i++) {
//				var comment = comments[i];
//				console.log(comment);
//				var node_id = comment.node_id;
//				var $append_to = ((comment.parent_id)) ? $('#comment-'+comment.parent_id) : $('#node-'+node_id+' .comments');
//				$append_to.append('<div class="comment" id="comment-'+comment.comment_id+'"><h2 class="comment-title">'+comment.title+'</h2><div class="comment-user">'+comment.user_id+'</div><div class="comment-body">'+comment.body+'</div></div>');
//				console.log($append_to);
//			}
			
//		});
//	};
//	$(function(){
//		init_comments_conts();
//		load_comments();
//		var $nodes = $('span.node');
//		/*$nodes.hover(function(){
//			$(this).find('.comment').show();
//			},
//			function(){$(this).find('.comment').hide();
//			});
//		*/
		
//	});
//})(jQuery);

//knockout implementation (for fun)

function comment(comment_id, parent_id, node_id, title, user_id, body) {
    var self = this;

    self.comment_id = ko.observable(comment_id);
    self.parent_id = ko.observable(parent_id);
    self.node_id = ko.observable(node_id);
    self.title = ko.observable(title);
    self.user_id = ko.observable(user_id);
    self.body = ko.observable(body);
    self.htmlBody = ko.computed(function () {
        return "<p>" + self.body() + "</p";
    });
}

function viewModel() {
    var self = this;

    self.comments = ko.observableArray();

    self.loadComments = function () {
        $.getJSON('comments.json', function (data) {
            ko.utils.arrayForEach(data, function (c) {

                self.comments.push(new comment(c.comment_id, c.parent_id, c.node_id, c.title, c.user_id, c.body));
                
                console.log(c);
                var node_id = c.node_id;
                var $append_to = ((c.parent_id)) ? $('#comment-' + c.parent_id) : $('#node-' + node_id + ' .comments');
                $append_to.append('<div class="comment" id="comment-' + c.comment_id + '"><h2 class="comment-title">' + c.title + '</h2><div class="comment-user">' + c.user_id + '</div><div class="comment-body">' + c.body + '</div></div>');
                //console.log($append_to);
            });
        });
    };
    self.parseDoucment = function () {
        $('.node').each(
        	function () {
        	    var $node = $(this);
        	    var id = $node.attr('id');
        	    $node.append('<span class="comments-wrapper">'+
                    '<div class="comments"></div>' +
                    '<div class="comments-reply">'+
                    '<textarea id="comments-reply-"' + id + 'name="comments-reply-"' + id + '"/></div></span>');
        	}
        );
    };

    self.parseDoucment();
    self.loadComments();

    
    
};



var vm = new viewModel();

ko.applyBindings(vm);