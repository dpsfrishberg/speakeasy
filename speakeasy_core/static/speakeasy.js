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

(function($){

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

    var articleID = null;
    $(function(){
        var getIDCall = $.ajax({
                url: "//speakeasy.frishberg.net/article/id.json",
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

       getIDCall.done(function() {
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
                }
            },
            jsonpCallback: "jsonp123",
            dataType: "json"
           });
       });
       console.info(document.body);
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

    });
})(jQuery);