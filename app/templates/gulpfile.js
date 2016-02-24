/* jshint node: true */
'use strict';
// generated on <%= generatedOn %> using <%= generatorName %> <%= generatorVersion %>

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var lazypipe = require('lazypipe');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var argv = require('minimist')(process.argv.slice(2));
var pkg = require('./package.json');
var LICENSE_PLACEHOLDER = '/*! @license credits */';
var IS_DIST = !!argv.dist || !!argv.d;
<% if (includeUncss) { -%>
var UNCSS = typeof argv.dist === 'string' ? argv.dist.split(',').indexOf('uncss') !== -1 : false;
<% } -%>
var MINIFY_HTML = typeof argv.dist === 'string' ? argv.dist.split(',').indexOf('htmlmin') !== -1 : false;
var banner = require('lodash.template')([
  '/*!',
  ' * <@%- pkg.config.namePretty %@> v<@%- pkg.version %@> (<@%- pkg.homepage %@>)',
  ' * <@%- pkg.description %@>',
  ' *',
  ' * by <@%- pkg.author.name %@> <<@%- pkg.author.email %@>> (<@%- pkg.author.url %@>)',
  ' * <@%- pkg.license.type %@> <@%- pkg.config.startYear %@><@% if (new Date().getFullYear() > pkg.config.startYear) { %@>-<@%- new Date().getFullYear() %@><@% } %@><@% if (pkg.license.url) { %@> (<@%- pkg.license.url %@>)<@% } %@>',
  ' */\n'
].join('\n'))({ pkg: pkg });

gulp.task('styles', function () {
  return gulp.src('app/styles/*.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe($.postcss([
      require('autoprefixer')({browsers: ['last 2 versions', 'ie 8']}),
      require('css-mqpacker')({ sort: true })
    ]))
    .pipe($.if(IS_DIST, $.base64({
      extensions: ['svg', 'png', /\.jpg#datauri$/i],
      // exclude:    [/\.server\.(com|net)\/dynamic\//, '--live.jpg'],
      // maxImageSize: 8*1024, // bytes
      debug: true
    })))
    .pipe($.if(IS_DIST, $.replace(LICENSE_PLACEHOLDER, banner)))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(reload({stream: true}));
});

gulp.task('scripts', function (<% if (!includeModernizr) { %>cb<% } %>) {
<% if (includeModernizr) { -%>
  var modernizrConf = require('./app/scripts/modernizr.json');
  delete modernizrConf.dest;
  return gulp.src('app/scripts/*.js')
    // prepare the custom build @ https://modernizr.com/download
    .pipe($.modernizr(modernizrConf))
    .pipe($.if(IS_DIST, $.uglify({ preserveComments: function (node, comment) {
      return /\*.modernizr v/g.test(comment.value) || LICENSE_PLACEHOLDER === comment.value;
    }})))
    .pipe(gulp.dest('.tmp/scripts'));
<% } else { -%>
  cb();
<% } -%>
});

function jshint (files) {
  return function () {
    return gulp.src(files)
      .pipe(reload({stream: true, once: true}))
      .pipe($.eslint(options))
      .pipe($.eslint.format())
      .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
  };
}

gulp.task('jshint', jshint('app/scripts/**/*.js'));
gulp.task('jshint:test', jshint('test/spec/**/*.js'));

var cssOptimization = lazypipe()
<% if (includeUncss) { -%>
  .pipe(function () {
    return $.if(UNCSS, $.uncss({
      html: ['app/*.html', '.tmp/*.html'],
      ignoreSheets: '/bower_components/g'
    }));
  })
<% } -%>
  .pipe($.cssnano);

var jsOptimization = lazypipe()
  .pipe($.uglify, { preserveComments: 'some', compress: { drop_console: true } })
  .pipe($.replace, LICENSE_PLACEHOLDER, banner);

var htmlOptimization = lazypipe()
  .pipe(function () {
    return $.if(MINIFY_HTML, $.htmlmin({ removeComments: true, loose: true, minifyJS: true, minifyCSS: true, collapseWhitespace: true }), $.prettify({ indent_size: 2, extra_liners: [] }));
  });

gulp.task('html', [<% if (useTemplateLanguage) { %>'views', <% } %>'styles', 'scripts'], function () {
  return gulp.src(['app/*.html', '.tmp/*.html'])
    .pipe($.useref({searchPath: ['.tmp', 'app', '.']}))
    .pipe($.if('*.css', cssOptimization()))
    .pipe($.if('*.js', jsOptimization()))
    .pipe($.if('*.html', htmlOptimization()))
    .pipe(gulp.dest('dist'));
});

gulp.task('images', function () {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}]
    })))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', function () {
  return gulp.src(require('main-bower-files')('**/*.{eot,svg,ttf,woff,woff2}', function (err) {})
    .concat('app/fonts/**/*'))
    .pipe(gulp.dest('.tmp/fonts'))
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('extras', function () {
  return gulp.src([
    'app/*.*',
<% if (!useTemplateLanguage) { -%>
    '!app/*.html',
<% } if (useTemplateLanguage) { -%>
    '!app/*.<%= tplLangExt %>'
<% } -%>
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('clean', require('del').bind(null, ['.tmp', 'dist']));

gulp.task('serve', [<% if (useTemplateLanguage) { %>'views', <% } %>'styles', 'scripts', 'fonts', 'wiredep'], function () {
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
  gulp.watch([
<% if (!useTemplateLanguage) { -%>
    'app/*.html',
<% } if (useTemplateLanguage) { -%>
    '.tmp/*.html',
<% } -%>
    'app/scripts/**/*.js',
    'app/images/**/*',
    '.tmp/fonts/*.*'
  ]).on('change', reload);
<% if (useTemplateLanguage) { -%>
  gulp.watch(['app/data/*.json', 'app/*.<%= tplLangExt %>', 'app/layouts/**/*.<%= tplLangExt %>'], ['views', reload]);
<% } -%>
  gulp.watch('app/styles/**/*.scss', ['styles']);
  gulp.watch('app/fonts/*.*', ['fonts']);
<% if (includeModernizr) { -%>
  gulp.watch('app/scripts/modernizr.json', ['scripts']);
<% } -%>
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
    .pipe(wiredep({
<% if (includeBootstrap) { -%>
      exclude: ['bootstrap-sass'],
<% } -%>
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('app/styles'));

<% if (useTemplateLanguage) { -%>
  gulp.src('app/*.<%= tplLangExt %>')
    .pipe(wiredep({<% if (includeBootstrap) { %>
      exclude: ['bootstrap-sass'],<% } %>
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app'));
<% } -%>
});

gulp.task('_build', ['jshint', 'html', 'images', 'fonts', 'extras'], function () {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

// an example of build task: `$ gulp build --dist htmlmin,`
gulp.task('build', ['clean'], function () {
  gulp.start('_build');
});

gulp.task('default', ['serve']);

<% if (useTemplateLanguage) { -%>
gulp.task('views', function () {
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
        $.util.log($.util.colors.yellow('A data file specific for this template is missing at: ' + dataFilePath));
        return data;
      }
    }))
<% if (useJade) { -%>
    .pipe($.jade({
      pretty: true
    }))
<% } if (useNunjucks) { -%>
    .pipe($.nunjucksRender({
      path: 'app'
    }))
<% } -%>
    .pipe(gulp.dest('.tmp'));
});
<% } -%>
<% if (deploy) { -%>

gulp.task('deploy', function() {
  var secrets = require('../secrets.json');
<% if (deploy === 'ftp') { -%>
  var ftp = require('vinyl-ftp');
  var conn = ftp.create({
    host: secrets.ftp.host,
    user: secrets.ftp.user,
    password: secrets.ftp.password,
    parallel: 10,
    log: $.util.log
  });
<% } -%>
  return gulp.src('dist/**', {
      base: 'dist',
      buffer: false
    })
<% if (deploy === 'sftp') { -%>
    .pipe($.sftp({
      host: secrets.ftp.host,
      user: secrets.ftp.user,
      passphrase: secrets.ssh.passphrase,
      remotePath: secrets.ftp.publicPath + '/<%= name %>/'
    }));
<% } else if (deploy === 'ftp') { -%>
    .pipe(conn.newer('/public_html/<%= name %>'))
    .pipe(conn.dest('/public_html/<%= name %>'));
<% } -%>
});
<% } -%>
