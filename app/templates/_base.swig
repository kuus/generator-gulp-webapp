<!doctype html>
<html<% if (includeModernizr) { %> class="no-js"<% } %> lang="en">
  <head>
    <meta charset="utf-8">
    <title>{% block meta_title %}<%= appPrettyName %>{% block meta_title__post %}{% endblock %}{% endblock %}</title>
    <meta name="description" content="{% block meta_description %}{% endblock %}">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="author" content="kuus <kunderikuus@gmail.com> (http://kunderikuus.net)">
    <link rel="apple-touch-icon" href="apple-touch-icon.png">
    {# Place favicon.ico in the root directory #}
    <!-- build:css styles/vendor.css-->
    <!-- bower:css-->
    <!-- endbower-->
    <!-- endbuild-->
    <!-- build:css styles/main.css-->
    <link rel="stylesheet" href="styles/main.css">
    <!-- endbuild--><% if (includeModernizr) { %>
    <!-- build:js scripts/vendor/modernizr.js-->
    <script src="../bower_components/modernizr/modernizr.js"></script>
    <!-- endbuild--><% } %>
  </head>
  <body>
    {% block body %}
    {% endblock %}
    <script>(function(b,o,i,l,e,r){b.GoogleAnalyticsObject=l;b[l]||(b[l]=function(){(b[l].q=b[l].q||[]).push(arguments)});b[l].l=+new Date;e=o.createElement(i);r=o.getElementsByTagName(i)[0];e.src='https://www.google-analytics.com/analytics.js';r.parentNode.insertBefore(e,r)}(window,document,'script','ga'));ga('create','UA-XXXXX-X');ga('send','pageview');</script>
    <!-- build:js scripts/vendor.js-->
    <script src="../bower_components/jquery/dist/jquery.js"></script>
    <!-- endbuild-->
    <!-- build:js scripts/plugins.js-->
    <script src="../bower_components/bootstrap-sass/assets/javascripts/bootstrap/affix.js"></script>
    <script src="../bower_components/bootstrap-sass/assets/javascripts/bootstrap/alert.js"></script>
    <script src="../bower_components/bootstrap-sass/assets/javascripts/bootstrap/dropdown.js"></script>
    <script src="../bower_components/bootstrap-sass/assets/javascripts/bootstrap/tooltip.js"></script>
    <script src="../bower_components/bootstrap-sass/assets/javascripts/bootstrap/modal.js"></script>
    <script src="../bower_components/bootstrap-sass/assets/javascripts/bootstrap/transition.js"></script>
    <script src="../bower_components/bootstrap-sass/assets/javascripts/bootstrap/button.js"></script>
    <script src="../bower_components/bootstrap-sass/assets/javascripts/bootstrap/popover.js"></script>
    <script src="../bower_components/bootstrap-sass/assets/javascripts/bootstrap/carousel.js"></script>
    <script src="../bower_components/bootstrap-sass/assets/javascripts/bootstrap/scrollspy.js"></script>
    <script src="../bower_components/bootstrap-sass/assets/javascripts/bootstrap/collapse.js"></script>
    <script src="../bower_components/bootstrap-sass/assets/javascripts/bootstrap/tab.js"></script>
    <!-- endbuild-->
    <!-- build:js scripts/main.js-->
    <script src="scripts/main.js"></script>
    <!-- endbuild-->
  </body>
</html>