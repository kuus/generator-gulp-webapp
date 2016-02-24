'use strict';
var generators = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');
var wiredep = require('wiredep');
var changeCase = require('change-case');
var mkdirp = require('mkdirp');
var gulpReplace = require('gulp-replace');

module.exports = generators.Base.extend({
  constructor: function () {
    var testLocal;

    generators.Base.apply(this, arguments);

    this.option('skip-welcome-message', {
      desc: 'Skips the welcome message',
      type: Boolean
    });

    this.option('skip-install-message', {
      desc: 'Skips the message after the installation of dependencies',
      type: Boolean
    });

    this.option('test-framework', {
      desc: 'Test framework to be invoked',
      type: String,
      defaults: 'mocha'
    });

    this.option('babel', {
      desc: 'Use Babel',
      type: Boolean,
      defaults: true
    });

    if (this.options['test-framework'] === 'mocha') {
      testLocal = require.resolve('generator-mocha/generators/app/index.js');
    } else if (this.options['test-framework'] === 'jasmine') {
      testLocal = require.resolve('generator-jasmine/generators/app/index.js');
    }

    this.composeWith(this.options['test-framework'] + ':app', {
      options: {
        'skip-install': this.options['skip-install']
      }
    }, {
      local: testLocal
    });
  },

  initializing: function () {
    this.pkg = require('../package.json');
    this.secrets = require('../../secrets.json') || {};
  },

  prompting: function () {
    var done = this.async();

    if (!this.options['skip-welcome-message']) {
      this.log(yosay('\'Allo \'allo! Out of the box I include HTML5 Boilerplate, jQuery, and a gulpfile to build your app.'));
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
        name: 'Nunjucks',
        value: 'njk',
        checked: true
      }, {
        name: 'Jade',
        value: 'jade',
        checked: false
      }, {
        name: 'None',
        value: 'html',
        checked: false
      }]
    }, {
      type: 'list',
      name: 'deploy',
      message: 'You want a gulp deploy task, which connection type?',
      choices: [{
        name: 'SFTP',
        value: 'sftp',
        checked: true
      }, {
        name: 'FTP',
        value: 'ftp',
        checked: false
      }, {
        name: 'None',
        value: 'none',
        checked: false
      }]
    }, {
      type: 'confirm',
      name: 'includeJQuery',
      message: 'Would you like to include jQuery?',
      default: true,
      when: function (answers) {
        return answers.features.indexOf('includeBootstrap') === -1;
      }
    }];

    this.prompt(prompts, function (answers) {
      var features = answers.features;

      function hasFeature(feat) {
        return features && features.indexOf(feat) !== -1;
      }

      function toShortName (string) {
        var splitted = string.split(' ');
        var shortname = '';
        splitted.forEach(function (word) {
          shortname += word.substr(0, 2);
        });
        return shortname;
      }

      // manually deal with the response, get back and store the results.
      // we change a bit this way of doing to automatically do this in the self.prompt() method.
      var appname = changeCase.paramCase(this.appname);

      this.app = {
        includeSass: true, // no prompt for this
        includeBootstrap: hasFeature('includeBootstrap'),
        includeModernizr: hasFeature('includeModernizr'),
        includeJQuery: answers.includeJQuery,
        useTemplateLanguage: answers.templating !== 'html',
        tplLangExt: answers.templating,
        useNunjucks: answers.templating === 'njk',
        useJade: answers.templating === 'jade',
        deploy: answers.deploy,
        name: appname,
        prettyName: changeCase.titleCase(appname),
        shortName: toShortName(changeCase.snakeCase(appname)),
        year: new Date().getFullYear(),
        generatedOn: new Date().toISOString().split('T')[0],
        generatorName: this.pkg.name,
        generatorVersion: this.pkg.version,
        includeBabel: this.options['babel'],
        testFramework: this.options['test-framework']
      };

      done();
    }.bind(this));
  },

  writing: {

    gulpfile: function () {
      this.registerTransformStream(gulpReplace(/<@%/g, '<%'));
      this.registerTransformStream(gulpReplace(/%@>/g, '%>'));

      this.fs.copyTpl(
        this.templatePath('gulpfile.js'), // 'gulpfile.babel.js'
        this.destinationPath('gulpfile.js'), // 'gulpfile.babel.js'
        this.app
      );
    },

    packageJSON: function () {
      this.fs.copyTpl(
        this.templatePath('_package.json'),
        this.destinationPath('package.json'),
        this.app
      );
    },

    babel: function () {
      this.fs.copy(
        this.templatePath('babelrc'),
        this.destinationPath('.babelrc')
      );
    },

    git: function () {
      this.fs.copy(
        this.templatePath('gitignore'),
        this.destinationPath('.gitignore'));

      this.fs.copy(
        this.templatePath('gitattributes'),
        this.destinationPath('.gitattributes'));
    },

    bower: function () {
      var bowerJson = {
        name: this.app.name,
        private: true,
        dependencies: {}
      };

      if (this.app.includeBootstrap) {
        if (this.app.includeSass) {
          bowerJson.dependencies['bootstrap-sass'] = '~3.3.5';
          bowerJson.overrides = {
            'bootstrap-sass': {
              'main': [
                'assets/stylesheets/_bootstrap.scss',
                'assets/fonts/bootstrap/*',
                'assets/javascripts/bootstrap.js'
              ]
            }
          };
        } else {
          bowerJson.dependencies['bootstrap'] = '~3.3.5';
          bowerJson.overrides = {
            'bootstrap': {
              'main': [
                'less/bootstrap.less',
                'dist/css/bootstrap.css',
                'dist/js/bootstrap.js',
                'dist/fonts/*'
              ]
            }
          };
        }
      } else if (this.app.includeJQuery) {
        bowerJson.dependencies['jquery'] = '~2.1.1';
      }

      this.fs.writeJSON('bower.json', bowerJson);
      this.fs.copy(
        this.templatePath('bowerrc'),
        this.destinationPath('.bowerrc')
      );
    },

    editorConfig: function () {
      this.fs.copy(
        this.templatePath('editorconfig'),
        this.destinationPath('.editorconfig')
      );
    },

    h5bp: function () {
      this.fs.copy(
        this.templatePath('favicon.ico'),
        this.destinationPath('app/favicon.ico')
      );

      this.fs.copy(
        this.templatePath('apple-touch-icon.png'),
        this.destinationPath('app/apple-touch-icon.png')
      );

      this.fs.copy(
        this.templatePath('robots.txt'),
        this.destinationPath('app/robots.txt'));
    },

    styles: function () {
      var css = 'main';

      if (this.app.includeSass) {
        css += '.scss';
      } else {
        css += '.css';
      }

      this.fs.copyTpl(
        this.templatePath(css),
        this.destinationPath('app/styles/' + css),
        this.app
      );
    },

    scripts: function () {
      if (this.app.includeModernizr) {
        this.fs.copy(
          this.templatePath('modernizr.json'),
          this.destinationPath('app/scripts/modernizr.json')
        );
      }
      this.fs.copy(
        this.templatePath('main.js'),
        this.destinationPath('app/scripts/main.js')
      );
    },

    html: function () {
      var ext = this.app.tplLangExt;

      // path prefix for Bootstrap JS files
      if (this.app.includeBootstrap) {
        this.app.bsPath = '/bower_components/';
        this.app.bsPlugins = [
          'affix',
          'alert',
          'dropdown',
          'tooltip',
          'modal',
          'transition',
          'button',
          'popover',
          'carousel',
          'scrollspy',
          'collapse',
          'tab'
        ];

        if (this.app.includeSass) {
          this.app.bsPath += 'bootstrap-sass/assets/javascripts/bootstrap/';
        } else {
          this.app.bsPath += 'bootstrap/js/';
        }
      }

      if (this.app.useTemplateLanguage) {
        this.fs.copyTpl(
          this.templatePath('_base.' + ext),
          this.destinationPath('app/_base.' + ext),
          this.app
        );
        this.fs.copyTpl(
          this.templatePath('layouts/default.' + ext),
          this.destinationPath('app/layouts/default.' + ext),
          this.app
        );
        this.fs.copyTpl(
          this.templatePath('layouts/partials/header.' + ext),
          this.destinationPath('app/layouts/partials/header.' + ext),
          this.app
        );
        this.fs.copyTpl(
          this.templatePath('layouts/partials/footer.' + ext),
          this.destinationPath('app/layouts/partials/footer.' + ext),
          this.app
        );
        this.fs.copy(
          this.templatePath('data/_dummy.json'),
          this.destinationPath('app/data/_dummy.json')
        );
        this.fs.copyTpl(
          this.templatePath('data/_common.json'),
          this.destinationPath('app/data/_common.json'),
          this.app
        );
        this.fs.copyTpl(
          this.templatePath('data/index.json'),
          'app/data/index.json',
          this.app
        );
      }

      this.fs.copyTpl(
        this.templatePath('index.' + ext),
        this.destinationPath('app/index.' + ext),
        this.app
      );
    },

    misc: function () {
      mkdirp('app/images');
      mkdirp('app/fonts');
    }
  },

  install: function () {
    this.installDependencies({
      skipMessage: this.options['skip-install-message'],
      skipInstall: this.options['skip-install']
    });
  },

  end: function () {
    var bowerJson = this.fs.readJSON(this.destinationPath('bower.json'));
    var howToInstall =
      '\nAfter running ' +
      chalk.yellow.bold('npm install & bower install') +
      ', inject your' +
      '\nfront end dependencies by running ' +
      chalk.yellow.bold('gulp wiredep') +
      '.';
    var indexFileName = this.app.useTemplateLanguage ? '_base.' + this.app.tplLangExt : 'index.html';

    if (this.options['skip-install']) {
      this.log(howToInstall);
      return;
    }

    // wire Bower packages to .html
    wiredep({
      bowerJson: bowerJson,
      directory: 'bower_components',
      exclude: ['bootstrap-sass', 'bootstrap.js'],
      ignorePath: /^(\.\.\/)*\.\./,
      src: 'app/' + indexFileName
    });

    if (this.app.includeSass) {
      // wire Bower packages to .scss
      wiredep({
        bowerJson: bowerJson,
        directory: 'bower_components',
        ignorePath: /^(\.\.\/)+/,
        src: 'app/styles/*.scss'
      });
    }
  }
});
