/// <reference path="knockout-2.1.0.js" />
/// <reference path="jquery.min.js" />
/// <reference path="jquery-ui.min.js" />


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

    //define the properties of a comment
    self.comment_id = ko.observable(comment_id);
    self.parent_id = ko.observable(parent_id);
    self.node_id = ko.observable(node_id);
    self.title = ko.observable(title);
    self.user_id = ko.observable(user_id);
    self.body = ko.observable(body);
    self.htmlBody = ko.computed(function () {
        return "<p>" + self.body() + "</p";
    });


    console.log(self);
    var node_id = node_id;
    var $append_to = ((parent_id)) ? $('#comment-' + parent_id) : $('#node-' + node_id + ' .comments');
    $append_to.append('<div class="comment" id="comment-' + comment_id + '"><h2 class="comment-title">' + title + '</h2><div class="comment-user">' + user_id + '</div><div class="comment-body">' + body + '</div></div>');
    //console.log($append_to);
}



function documentSection(id, node) {
    var self = this;

    
    self.id = ko.observable(id);//define a var to hold the id
    self.id_ = ko.computed(function(){ return "#" + self.id() });//used to so you don't have to type "#" + self.id() a bunch of times
    self.content = ko.observable(node);//grab the content that was passed in
    self.comments = ko.observableArray();//define an array of comments

    self.applyComments = function(){//added the id node-1_comments to be able to get them individually in addition to as a collection
        self.content().append(
            '<span class="'+self.id()+'_comments comments-wrapper">' +
                '<div class="comments"></div>' +
                '<div class="comments-reply">'+
                '<textarea id="comments-reply-"' + id + 'name="comments-reply-"' + id + '"/></div></span>');
    };

    //set up the hover and keep hover
    $(self.id_()).hover(
        function () {
            console.log("Hover On : " + self.id_());
            ///TODO: show only you and hide everyone else

            $(".comments-wrapper").css("display", "none");
            console.log("showing: " + self.id() + "_comments");
            $("."+self.id() + "_comments").css("display", "block");

        },
        function () {
            console.log("Hover Off : " + self.id_());
        }
    );
}

function viewModel() {
    //Step 2 and so on below
    var self = this;

    //set up and array for the comments
    self.comments = ko.observableArray();

    //set up an array for the document section(need to think of a better name, all I could come up with)
    self.document = ko.observableArray();

    //bring in the comments and put them into usable objects (defined above)
    self.loadComments = function () {
        $.getJSON('comments.json', function (data) {
            ko.utils.arrayForEach(data, function (c) {//for each of the object in the 'data', run function(c){...} with c being the current object
                //push a new comment into the viewModel's array of comments, just like a normal constructor
                self.comments.push(new comment(c.comment_id, c.parent_id, c.node_id, c.title, c.user_id, c.body));
            });
        });
    };

    //parse the document
    self.parseDoucment = function () {

        //for each of the element with the class 'node'
        $('.node').each(function(){
            var node = $(this); //grab the none

            //define a new documentSection and pass in the id and the node value(not sure if this is needed)
            var section = new documentSection(node.attr('id'), node);

            //run the init basically to load the comments
            section.applyComments();

            //keep track of it by putting it in the array of document sections
            self.document.push(section);
        });
    };

    //actually run the parseDocument
    self.parseDoucment();

    //actually run the loadComments
    self.loadComments();

    
    
};


//Step 1
var vm = new viewModel();

//Step 3
ko.applyBindings(vm);

//I can explain this all this weekend

/*
    Notes: 
    -To get the actual value out of the object call whatever.id() because whaterver.id is a function, id() gets the actual value 
    -http://knockoutjs.com/documentation/introduction.html

*/
