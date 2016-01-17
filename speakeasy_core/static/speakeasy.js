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

    var articleID = null;
    $(function(){
        $.ajax({
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
       console.info(document.body);
       $(document).on("mouseup", "body > p", function(e) {
            var text = getSelectedText();
            console.info(e.target);
            var xpath = getXPath(e.target);
            console.info(xpath);
            console.info(jQuery(e.target).text().indexOf(text));
            jQuery(document).tooltip({
            items: "body",
            content: function(element) {
                console.info(element);
                return '<p><a id="create-node">Add a comment</a></p><p><a id="cancel-node">Cancel</a></p>';
            },
            position: {
                of: e,
                my: "right+3 bottom-3"
            }
            });
            jQuery(document).tooltip("open");
        });
        $(document.body).on( "click", "#create-node", function(e){
            e.preventDefault();
            $(document).tooltip("destroy");

         });
         $(document.body).on("click", "#cancel-node", function(e){
            e.preventDefault();
            $(document).tooltip("destroy");
         });

    });
})(jQuery);