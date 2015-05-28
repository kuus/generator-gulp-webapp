/* global -$ */
'use strict';
// generated on <%= (new Date).toISOString().split('T')[0] %> using <%= pkg.name %> <%= pkg.version %>

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var argv = require('minimist')(process.argv.slice(2));
var banner = [
  '/*!',
  ' *<%=" \<%- pkg.config.namePretty %\> v\<%- pkg.version %\> (\<%- pkg.homepage %\>)" %>',
  ' *<%=" \<%- pkg.description %\>" %>',
  ' *',
  ' *<%=" by \<%- pkg.author.name %\> <\<%- pkg.author.email %\>> (\<%- pkg.author.url %\>)" %>',
  ' *<%=" \<%- pkg.license.type %\> \<%- pkg.config.startYear %\>\<% if (new Date().getFullYear() > pkg.config.startYear) { %\>-\<%- new Date().getFullYear() %\>\<% } %\>\<% if (pkg.license.url) { %\> (\<%- pkg.license.url %\>)\<% } %\>" %>',
  ' */\n'
].join('\n');

gulp.task('styles', function () {
  return gulp.src('app/styles/*.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe($.postcss([
      require('autoprefixer-core')({browsers: ['last 2 versions', 'ie 8']})
    ]))
    .pipe($.combineMediaQueries()) // { log: true }
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(reload({stream: true}));
});

function jshint(files) {
  return function () {
    return gulp.src(files)
      .pipe(reload({stream: true, once: true}))
      .pipe($.jshint())
      .pipe($.jshint.reporter('jshint-stylish'))
      .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
  };
}

gulp.task('jshint', jshint('app/scripts/**/*.js'));
gulp.task('jshint:test', jshint('test/spec/**/*.js'));

gulp.task('_html', [<% if (useTemplateLanguage) { %>'views', <% } %>'styles'], function () {
  var assets = $.useref.assets({searchPath: ['.tmp', 'app', '.']});

  return gulp.src(['app/*.html', '.tmp/*.html'])
    .pipe(assets)
    .pipe($.if('*.js', $.uglify({ preserveComments: 'some', compress: { drop_console: true } })))
    .pipe($.if('*.css', $.minifyCss({ compatibility: 'ie8,+units.rem' })))
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.if('*.html', $.minifyHtml({conditionals: true, loose: true})))
    .pipe(gulp.dest('dist'));
});

gulp.task('html', ['_html'], function () {
  return gulp.src(['dist/scripts/main.js', 'dist/styles/main.css'], { base: 'dist' })
    .pipe($.header(banner, { pkg: require('./package.json') }))
    .pipe(gulp.dest('dist'));
});

gulp.task('images', function () {
  return gulp.src('app/images/**/*')
    .pipe($.if($.if.isFile, $.cache($.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}]
    }))
    .on('error', function(err){ console.log(err); this.end; })))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', function () {
  return gulp.src(require('main-bower-files')({
    filter: '**/*.{eot,svg,ttf,woff,woff2}'
  }).concat('app/fonts/**/*'))
    .pipe(gulp.dest('.tmp/fonts'))
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('extras', function () {
  return gulp.src([
    'app/*.*',<% if (!useTemplateLanguage) { %>
    '!app/*.html',<% } if (useTemplateLanguage) { %>
    '!app/*.<%= tplLangExt %>'<% } %>
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('clean', require('del').bind(null, ['.tmp', 'dist']));

gulp.task('serve', [<% if (useTemplateLanguage) { %>'views', <% } %>'styles', 'fonts'], function () {
  browserSync({
    notify: false,
    port: 9000,
    open: (!!argv.o || !!argv.open) || false,
    server: {
      baseDir: ['.tmp', 'app'],
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  // watch for changes
  gulp.watch([<% if (!useTemplateLanguage) { %>
    'app/*.html',<% } if (useTemplateLanguage) { %>
    '.tmp/*.html',<% } %>
    'app/scripts/**/*.js',
    'app/images/**/*',
    '.tmp/fonts/**/*'
  ]).on('change', reload);<% if (useTemplateLanguage) { %>
  gulp.watch(['app/data/*.json', 'app/*.<%= tplLangExt %>', 'app/layouts/**/*.<%= tplLangExt %>'], ['views', reload]);<% } %>
  gulp.watch('app/styles/**/*.scss', ['styles']);
  gulp.watch('app/fonts/**/*', ['fonts']);
  gulp.watch('bower.json', ['wiredep', 'fonts']);
});

gulp.task('serve:dist', function () {
  browserSync({
    notify: false,
    port: 9000,
    open: (!!argv.o || !!argv.open) || false,
    server: {
      baseDir: ['dist']
    }
  });
});

gulp.task('serve:test', function () {
  browserSync({
    notify: false,
    open: false,
    port: 9000,
    ui: false,
    server: {
      baseDir: 'test'
    }
  });

  gulp.watch([
    'test/spec/**/*.js',
  ]).on('change', reload);

  gulp.watch('test/spec/**/*.js', ['jshint:test']);
});

// inject bower components
gulp.task('wiredep', function () {
  var wiredep = require('wiredep').stream;

  gulp.src('app/styles/*.scss')
    .pipe(wiredep({<% if (includeBootstrap) { %>
      exclude: ['bootstrap-sass'],<% } %>
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('app/styles'));

  <% if (useTemplateLanguage) { %>gulp.src('app/*.<%= tplLangExt %>')
    .pipe(wiredep({<% if (includeBootstrap) { %>
      exclude: ['bootstrap-sass'],<% } %>
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app'));<% } %>
});

gulp.task('build', ['jshint', 'html', 'images', 'fonts', 'extras'], function () {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', ['serve']);

<% if (useTemplateLanguage) { %>gulp.task('views', function () {
  var extend = require('extend');
  var fs = require('fs');
  var path = require('path');

  return gulp.src(['app/*.<%= tplLangExt %>', '!app/_*.<%= tplLangExt %>'])
    .pipe($.data(function (file) {
      var data = {
        common: JSON.parse(fs.readFileSync('./app/data/_common.json')),
        dummy: JSON.parse(fs.readFileSync('./app/data/_dummy.json'))
      };
      var dataFilePath = './app/data/' + path.basename(file.path, '.<%= tplLangExt %>') + '.json';
      try {
        return extend(data, JSON.parse(fs.readFileSync(dataFilePath)));
      } catch(e) {
        console.log('A data file specific for this template is missing at: ' + dataFilePath, e);
        return {};
      }
    }))<% if (useJade) { %>
    .pipe($.jade({
      pretty: true
    }))<% } if (useSwig) { %>.pipe($.swig({
      defaults: {
        cache: false
      }
    }))<% } %>
    .pipe(gulp.dest('.tmp'));
});<% } %>
