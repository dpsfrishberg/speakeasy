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

    function showNode(nodeID, text, xpath, offset, parentID) {
        var element = $(document).xpathEvaluate(xpath);
        console.info(xpath);
        console.info(element);
        element.html(
            jQuery(element).html().replace(
                text, '<span class="node" data-node-id="' + nodeID + '">' + text + '</span>'
            )
        );
    }

    function createNode(element, text, xpath, offset, parentID) {
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
                showNode(nodeID, text, xpath, offset, parentID);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error(errorThrown);
            },
            jsonpCallback: "jsonp123",
            dataType: "json"
        });
    }


    $(document).on("mouseup", "body > p", function(e) {
        var element = e.target;
        var text = getSelectedText();
        console.info(e.target);
        var xpath = getXPath(e.target);
        console.info(xpath);
        var offset = jQuery(e.target).text().indexOf(text);
        console.info(offset);
        jQuery(document).tooltip({
        items: "body",
        content: function(element) {
            console.info(element);
            return '<p><a href="#" id="create-node">Add a comment</a></p><p><a id="cancel-node">Cancel</a></p>';
        },
        position: {
            of: e,
            my: "right+3 bottom-3"
        }
        });
        jQuery(document).tooltip("open");
        $(document.body).on( "click", "#create-node", function(e){
            e.preventDefault();
            $(document).tooltip("destroy");
            createNode(element, text, xpath, offset, null);
         });
         $(document.body).on("click", "#cancel-node", function(e){
            e.preventDefault();
            $(document).tooltip("destroy");
         });
    });


    $(function(){
        var getIDCall = $.ajax({
            url: "/article/id.json",
            data: {
                url: window.location.href
            },
            type: "get",
            crossDomain: "true",
            success: function(data, textStatus, jqXHR) {
                console.info("data");
                console.info(data);
                articleID = data.id;
                console.info(articleID);

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
                console.info("data");
                console.info(data);
                var nodes = data.nodes;
                for (var i = 0; i < nodes.length; i++) {
                    var node = nodes[i];
                    showNode(node.nodeID, node.text, node.xpath, node.offset, null);
                    vm.nodes[node.nodeID] = {
                        nodeID: node.nodeID,
                        text: node.text,
                        parentID: null
                    };
                }
            },
            jsonpCallback: "jsonp123",
            dataType: "json"
           });
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
        '</div>');

        function viewModel () {
            var self = this;
            self.activeNode = ko.observable(null);
            self.nodes = ko.mapping.fromJS({});
            self.activeTrail = ko.computed(function(){
                var activeNode = self.activeNode();
                return (activeNode) ? [activeNode] : [];
            });
        }


        /*speakeasy.viewModel = viewModel = ko.mapping.fromJS({
            activeNode: null,
            nodes: {},
            activeTrail: function(){
                var activeNode = viewModel.activeNode;
                return (activeNode) ? [activeNode] : [];
            }
            }
        );*/
        speakeasy.vm = vm = new viewModel();
        ko.applyBindings(vm);

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
    });
})(jQuery);
