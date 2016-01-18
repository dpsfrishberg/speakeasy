$.fn.xpathEvaluate = function (xpathExpression) {
   // http://stackoverflow.com/questions/12243661/javascript-use-xpath-in-jquery
   // NOTE: vars not declared local for debug purposes
   $this = this.first(); // Don't make me deal with multiples before coffee

   // Evaluate xpath and retrieve matching nodes
   xpathResult = this[0].evaluate(xpathExpression, this[0], null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

   result = [];
   while (elem = xpathResult.iterateNext()) {
      result.push(elem);
   }

   $result = jQuery([]).pushStack( result );
   return $result;
};

var speakeasy = function(){};



(function($){
    var articleID = null;
    var vm;

    function getXPath(element) {
    // http://stackoverflow.com/questions/3454526/how-to-calculate-the-xpath-position-of-an-element-using-javascript
        var xpath = '';
        for ( ; element && element.nodeType == 1; element = element.parentNode )
        {
            var id = $(element.parentNode).children(element.tagName).index(element) + 1;
            id > 1 ? (id = '[' + id + ']') : (id = '');
            xpath = '/' + element.tagName.toLowerCase() + id + xpath;
        }
        return xpath;
    }

    function getSelectedText() {
        // http://stackoverflow.com/questions/3545018/selected-text-event-trigger-in-javascript
        if (window.getSelection) {
            return window.getSelection().toString();
        } else if (document.selection) {
            return document.selection.createRange().text;
        }
        return '';
    }


    $(function(){
        var lastClickEvent;
        $.contextMenu({
            selector: "body",
            trigger: "none",
            callback: function(key, options) {
                if (key == "add-comment") {
                    var element = lastClickEvent.target;
                    var text = getSelectedText();

                    var comment = element.closest(".comment");

                    var isComment = !!comment;

                    var xpath = (isComment) ? "." : getXPath(element);
                    var offset = $(element).text().indexOf(text);

                    var commentID = (isComment) ? $(comment).data("commentId") : null;
                    createNode(element, text, xpath, offset, commentID);
                }
            },
            items: {
                "add-comment": {
                    name: "Add a comment..."
                },
                "cancel": {
                    name: "Cancel"
                }
            },
            zIndex: function(){return 999999999;},
            position: function(opt, x, y) {
            console.info(lastClickEvent);
                opt.$menu.position({my: "left top", at: "right bottom", of: lastClickEvent});
            }
        });

        $(document).on("mouseup", "body > p, .comment > p", function(e) {
            lastClickEvent = e;
            var selectedText = getSelectedText();
            console.info("hmm");
            if (selectedText && selectedText != "") {
                console.info("fooey");
                $("body").contextMenu();
            }
        });


        function setActiveNode(nodeID) {
            getNodes.complete(function(){

                var node = vm.nodes[nodeID];
                vm.activeNode(node);
                //node.clearNewComments();
            });
        }
        function clearActiveNode(nodeID) {
            vm.activeNode(null);
        };


        function showBreadcrumb() {
            $("html").addClass("inactive");
            $("#breadcrumb").removeClass("inactive");
        };
        function hideBreadcrumb() {
            $("#breadcrumb").addClass("inactive");
            $("html").removeClass("inactive");
        };

        function breadcrumbIsShown() {

            var ret = !($("#breadcrumb").hasClass("inactive"));
            return ret;
        };


        $(document.body).append('<div id="breadcrumb" class="inactive">' +
        '    <div id="breadcrumb-trail" data-bind="foreach: activeTrail">' +
        '        <div class="node" data-bind="attr: {\'data-node-id\': nodeID}">' +
        '            <p class="node-content" data-bind="text: text">' +
        '            </p>' +
        '            <div class="clear">' +
        '            </div>' +
        '        </div>' +
        '    </div>' +
        '    <div id="comments" data-bind="foreach: activeNodeComments">' +
        '        <div class="comment" data-bind="attr: {\'data-comment-id\': commentID}">' +
        '            <p class="comment-content" data-bind="text: content">' +
        '            </p>' +
        '            <div class="clear">' +
        '            </div>' +
        '        </div>' +
        '    </div>' +
        '    <form id="comment-submit-form" action="" method="get">' +
	    '        <label for="response">Add a comment</label>' +
	    '        <textarea id="response" name="response"></textarea>' +
	    '        <input type="submit" id="submit" value="Submit"/>' +
	    '        <div class="clear"></div>' +
	    '    </form>' +
        '</div>');

        function SpeakeasyNode(nodeID, text, parentID) {
            var self = this;
            self.nodeID = ko.observable(nodeID);
            self.text = ko.observable(text);
            var parentComment = vm.comments[parentID] || null;
            self.parentComment = ko.observable(parentComment);

            self.comments = ko.observableArray([]);

            if (parentComment) {
                parentComment.nodes.push(self);
            }
        }

        function SpeakeasyComment(commentID, content, parentID) {
            var self = this;

            self.commentID = ko.observable(commentID);
            self.content = ko.observable(content);

            var parentNode = vm.nodes[parentID];
            self.parentNode = ko.observable(parentNode);

            self.nodes = ko.observableArray([]);

            parentNode.comments.push(self);
        }

        function showNode(nodeID, text, xpath, offset, parentID) {
            if (parentID == null) {
                var element = $(document).xpathEvaluate(xpath);
            }
            else {
                var element = $(".comment[data-comment-id='"+parentID+"'] > p");
            }
            element.html(
                jQuery(element).html().replace(
                    text, '<span class="node" data-node-id="' + nodeID + '">' + text + '</span>'
                )
            );
        }

        function createNode(element, text, xpath, offset, parentID) {
            console.info("creating node")
            console.info(element);
            console.info(text);
            console.info(xpath);
            console.info(offset);
            console.info(parentID);
            $.ajax({
                url: "/article/create-node.json",
                data: {
                    text: text,
                    xpath: xpath,
                    offset: offset,
                    articleID: articleID,
                    parentID: parentID
                },
                type: "get",
                crossDomain: "true",
                success: function(data, textStatus, jqXHR) {
                    var nodeID = data.nodeID;
                    var showNow = false;
                    if (parentID == null) {
                        showNow = true;
                    }
                    else if (vm.comments[parentID].parentNode() === vm.activeNode()) {
                        showNow = true;
                    }
                    if (showNow) {
                        showNode(nodeID, text, xpath, offset, parentID);
                    }
                    speakeasy.vm.nodes[nodeID] = new SpeakeasyNode(nodeID, text, parentID);
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.error(errorThrown);
                },
                jsonpCallback: "jsonp123",
                dataType: "json"
            });
        }



        function viewModel () {
            var self = this;
            self.activeNode = ko.observable(null);
            self.nodes = ko.mapping.fromJS({});
            self.comments = ko.mapping.fromJS({});
            self.activeTrail = ko.computed(function(){
                var activeNode = self.activeNode();
                return (activeNode) ? [activeNode] : [];
            });
            self.activeNodeComments = ko.computed(function() {
                var activeNode = self.activeNode();
                return (activeNode) ? activeNode.comments() : [];
            });
        }

        speakeasy.vm = vm = new viewModel();
        ko.applyBindings(vm);

        var getIDCall = $.ajax({
            url: "/article/id.json",
            data: {
                url: window.location.href
            },
            type: "get",
            crossDomain: "true",
            success: function(data, textStatus, jqXHR) {
                articleID = data.id;
            },
            error: function(jqXHR, textStatus, errorThrown) {
                articleID = null;
                console.error(errorThrown);
            },
            jsonpCallback: "jsonp123",
            dataType: "json"
        });

        var getNodes = getIDCall.done(function() {
           $.ajax({
            url: "/article/nodes.json",
            data: {
                articleID: articleID
            },
            type: "get",
            crossDomain: "true",
            success: function(data, textStatus, jqXHR) {
                var nodes = data.nodes;
                var comments = data.comments;
                for (var i = 0; i < nodes.length; i++) {
                    var node = nodes[i];
                    if (node.parentID == null) {
                        showNode(node.nodeID, node.text, node.xpath, node.offset, null);
                    }
                    vm.nodes[node.nodeID] = new SpeakeasyNode(node.nodeID, node.text, node.parentID);
                }
                for (var i = 0; i < comments.length; i++) {
                    var comment = comments[i];
                    vm.comments[comment.commentID] = new SpeakeasyComment(comment.commentID, comment.content, comment.parentID);
                }
            },
            jsonpCallback: "jsonp123",
            dataType: "json"
           });
       });



	    $(document).on('click', '.node', function(e) {
			setActiveNode($(e.target).closest('.node').data("node-id"));
	        showBreadcrumb();
			e.preventDefault();
            e.stopPropagation();

		});
		$(document).on('click touchstart', '#breadcrumb, body', function(e) {
            if (breadcrumbIsShown() && ($(e.target).is("#breadcrumb") || $(e.target).parents("#breadcrumb").length == 0)) {
                    hideBreadcrumb();
                    clearActiveNode();
                }
	    });

	    $("#comment-submit-form").on("submit", function(e) {
	        e.preventDefault();
	        $.ajax(
                {
                    url: "/article/create-comment.json",
                    data: {
                        content: $("#response").val(),
                        articleID: articleID,
                        parentID: vm.activeNode().nodeID()
                    },
                    type: "get",
                    crossDomain: "true",
                    success: function(data, textStatus, jqXHR) {
                        var commentID = data.commentID;
                        var newComment = new SpeakeasyComment(commentID, data.content, data.parentID);

                        vm.comments[commentID] = newComment;
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        console.error(errorThrown);
                    },
                    jsonpCallback: "jsonp123",
                    dataType: "json"
                }
            );
	    });
    });
})(jQuery);
