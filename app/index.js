'use strict';
var fs = require('fs');
var path = require('path');
var yeoman = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');
var wiredep = require('wiredep');
var lodash = require('lodash');
var changeCase = require('change-case');

module.exports = yeoman.generators.Base.extend({
  constructor: function () {
    yeoman.generators.Base.apply(this, arguments);

    this.option('test-framework', {
      desc: 'Test framework to be invoked',
      type: String,
      defaults: 'mocha'
    });

    this.option('skip-welcome-message', {
      desc: 'Skips the welcome message',
      type: Boolean
    });

    this.option('skip-install', {
      desc: 'Skips the installation of dependencies',
      type: Boolean
    });

    this.option('skip-install-message', {
      desc: 'Skips the message after the installation of dependencies',
      type: Boolean
    });
  },

  initializing: function () {
    this.pkg = require('../package.json');
    this.secrets = require('../../secrets.json') || {};
  },

  prompting: function () {
    var done = this.async();

    if (!this.options['skip-welcome-message']) {
      this.log(yosay('\'Allo \'allo! Out of the box I include HTML5 Boilerplate, jQuery, and a gulpfile.js to build your app.'));
    }

    var prompts = [{
    //   type: 'input',
    //   name: 'name',
    //   message: 'Your project name',
    //   default: this.appname
    // }, {
      type: 'checkbox',
      name: 'features',
      message: 'What more would you like?',
      choices: [{
        name: 'Bootstrap',
        value: 'includeBootstrap',
        checked: true
      }, {
        name: 'Modernizr',
        value: 'includeModernizr',
        checked: false
      }]
    }, {
      type: 'list',
      name: 'templating',
      message: 'Which template language you want to use?',
      choices: [{
        name: 'Swig',
        value: 'swig',
        checked: true
      }, {
        name: 'Jade',
        value: 'jade',
        checked: false
      }, {
        name: 'None',
        value: 'none',
        checked: false
      }]
    }];

    this.prompt(prompts, function (answers) {
      var features = answers.features;

      var hasFeature = function (feat) {
        return features.indexOf(feat) !== -1;
      };

      var toShortName = function (string) {
        var splitted = string.split(' ');
        var shortname = '';
        splitted.forEach(function (word) {
          shortname += word.substr(0, 2);
        });
        return shortname;
      };

      // manually deal with the response, get back and store the results.
      // we change a bit this way of doing to automatically do this in the self.prompt() method.
      this.includeBootstrap = hasFeature('includeBootstrap');
      this.includeModernizr = hasFeature('includeModernizr');

      this.useTemplateLanguage = answers.templating !== '';
      this.tplLangExt = this.useTemplateLanguage ? answers.templating : 'html';
      this.useJade = answers.templating === 'jade';
      this.useSwig = answers.templating === 'swig';

      this.appPrettyName = changeCase.titleCase(this.appname);
      this.appShortName = toShortName(changeCase.snakeCase(this.appname));
      this.appname = changeCase.paramCase(this.appname);
      this.appYear = new Date().getFullYear();

      this.deployFtp = true;

      done();
    }.bind(this));
  },

  writing: {
    packageJSON: function () {
      this.template('_package.json', 'package.json');
    },

    gulpfile: function () {
      this.template('gulpfile.js');
    },

    git: function () {
      this.copy('gitignore', '.gitignore');
      this.copy('gitattributes', '.gitattributes');
    },

    bower: function () {
      var bower = {
        name: this.appname,
        private: true,
        dependencies: {}
      };

      if (this.includeBootstrap) {
        var bs = 'bootstrap-sass';
        bower.dependencies[bs] = '~3.3.1';
      } else {
        bower.dependencies.jquery = '~2.1.1';
      }

      if (this.includeModernizr) {
        bower.dependencies.modernizr = '~2.8.1';
      }

      this.copy('bowerrc', '.bowerrc');
      this.write('bower.json', JSON.stringify(bower, null, 2));
    },

    jshint: function () {
      this.copy('jshintrc', '.jshintrc');
    },

    editorConfig: function () {
      this.copy('editorconfig', '.editorconfig');
    },

    h5bp: function () {
      this.copy('favicon.ico', 'app/favicon.ico');
      this.copy('apple-touch-icon.png', 'app/apple-touch-icon.png');
      this.copy('robots.txt', 'app/robots.txt');
    },

    mainStylesheet: function () {
      this.copy('main.scss', 'app/styles/main.scss');
    },

    writeIndex: function () {
      var indexFileName = this.useTemplateLanguage ? '_base' : 'index';
      indexFileName += '.' + this.tplLangExt;
      this.indexFile = this.src.read(indexFileName);
      this.indexFile = this.engine(this.indexFile, this);

      // wire Bootstrap plugins
      if (this.includeBootstrap) {
        var bs = '/bower_components/bootstrap-sass/assets/javascripts/bootstrap/';

        this.indexFile = this.appendScripts(this.indexFile, 'scripts/plugins.js', [
          bs + 'affix.js',
          bs + 'alert.js',
          bs + 'dropdown.js',
          bs + 'tooltip.js',
          bs + 'modal.js',
          bs + 'transition.js',
          bs + 'button.js',
          bs + 'popover.js',
          bs + 'carousel.js',
          bs + 'scrollspy.js',
          bs + 'collapse.js',
          bs + 'tab.js'
        ]);
      }

      this.indexFile = this.appendFiles({
        html: this.indexFile,
        fileType: 'js',
        optimizedPath: 'scripts/main.js',
        sourceFileList: ['scripts/main.js']
      });

      this.write('app/' + indexFileName, this.indexFile);
    },

    app: function () {
      var ext = this.tplLangExt;

      this.mkdir('app');
      this.mkdir('app/scripts');
      this.mkdir('app/styles');
      this.mkdir('app/images');
      this.mkdir('app/fonts');
      this.copy('main.js', 'app/scripts/main.js');
      this.copy('index.' + ext, 'app/index.' + ext);

      if (this.useTemplateLanguage) {
        this.copy('_base.' + ext, 'app/_base.' + ext);
        this.mkdir('app/layouts');
        this.mkdir('app/layouts/partials');
        this.copy('layouts/default.' + ext, 'app/layouts/default.' + ext);
        this.copy('layouts/partials/header.' + ext, 'app/layouts/partials/header.' + ext);
        this.copy('layouts/partials/footer.' + ext, 'app/layouts/partials/footer.' + ext);

        this.mkdir('app/data');
        this.template('data/_common.json', 'app/data/_common.json');
        this.template('data/_dummy.json', 'app/data/_dummy.json');
        this.template('data/index.json', 'app/data/index.json');
      }
    }
  },

  install: function () {
    var howToInstall =
      '\nAfter running ' +
      chalk.yellow.bold('npm install & bower install') +
      ', inject your' +
      '\nfront end dependencies by running ' +
      chalk.yellow.bold('gulp wiredep') +
      '.';

    if (this.options['skip-install']) {
      this.log(howToInstall);
      return;
    }

    this.installDependencies({
      skipMessage: this.options['skip-install-message'],
      skipInstall: this.options['skip-install']
    });

    this.on('end', function () {
      var bowerJson = this.dest.readJSON('bower.json');
      var indexFileName = this.useTemplateLanguage ? '_base' : 'index';
      indexFileName += '.' + this.tplLangExt;

      // wire Bower packages to .html
      wiredep({
        bowerJson: bowerJson,
        directory: 'bower_components',
        exclude: ['bootstrap-sass', 'bootstrap.js'],
        ignorePath: /^(\.\.\/)*\.\./,
        src: 'app/' + indexFileName
      });

      // ideally we should use composeWith, but we're invoking it here
      // because generator-mocha is changing the working directory
      // https://github.com/yeoman/generator-mocha/issues/28
      this.invoke(this.options['test-framework'], {
        options: {
          'skip-message': this.options['skip-install-message'],
          'skip-install': this.options['skip-install']
        }
      });
    }.bind(this));
  }
});
