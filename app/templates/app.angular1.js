/* jshint devel:true */
/*! @license credits */

'use strict';

angular.module('app', [<% if (includeBootstrap) { %>
    'ui.bootstrap'
  <% } %>])<% if (useNunjucks) { %>
  .config(function ($interpolateProvider) {
    $interpolateProvider.startSymbol('<@%{');
    $interpolateProvider.endSymbol('}%@>');
  })<% } %>
  /**
   * App controller
   *
   */
  .controller('AppCtrl', function ($scope, $log) {
    $log.log('app.js run', $scope);
  });
