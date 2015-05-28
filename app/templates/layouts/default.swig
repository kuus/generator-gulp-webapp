{% extends '../_base.swig' %}

{% block body %}

  {% block header %}
    {% include 'partials/header.swig' %}
  {% endblock %}

  <div class="container">
    {% block ie8_alert %}
    <!--[if lt IE 8]>
      <p class="alert alert-warning">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to improve your experience.</p>
    <![endif]-->
    {% endblock %}
    {% block content %}
    {% endblock %}
  </div>

  {% block footer %}
    {% include 'partials/footer.swig' %}
  {% endblock %}

{% endblock %}
