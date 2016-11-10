// generated on <%= generatedOn %> using <%= generatorName %> <%= generatorVersion %>
const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const browserSync = require('browser-sync');
const del = require('del');
const wiredep = require('wiredep').stream;
const lazypipe = require('lazypipe');
const minimist = require('minimist');
const tpl = require('lodash.template');
const pkg = require('./package.json');

const $ = gulpLoadPlugins();
const reload = browserSync.reload;
const argv = minimist(process.argv.slice(2));
const LICENSE_PLACEHOLDER = '/*! @license credits */';
const IS_DIST = !!argv.dist || !!argv.d;
<% if (includeUncss) { -%>
const UNCSS = typeof argv.dist === 'string' ? argv.dist.split(',').indexOf('uncss') !== -1 : false;
<% } -%>
const MANGLE_JS = typeof argv.dist === 'string' ? argv.dist.split(',').indexOf('mangle') !== -1 : false;
const MINIFY_HTML = typeof argv.dist === 'string' ? argv.dist.split(',').indexOf('htmlmin') !== -1 : false;
const INLINE_EVERYTHING = typeof argv.dist === 'string' ? argv.dist.split(',').indexOf('inline') !== -1 : false;
const DIST_STATIC = typeof argv.dist === 'string' ? argv.dist.split(',').indexOf('static') !== -1 : false;
const CACHE_BUST = typeof argv.dist === 'string' ? argv.dist.split(',').indexOf('nobust') === -1 : true;
const banner = tpl([
  '/*!',
  ' * <@%- pkg.config.namePretty %@> v<@%- pkg.version %@> (<@%- pkg.homepage %@>)',
  '<@% if (pkg.description) { %@> * <@%- pkg.description %@><@% } %@>',
  ' *',
  ' * by <@%- pkg.author.name %@> <<@%- pkg.author.email %@>> (<@%- pkg.author.url %@>)',
  ' * <@%- pkg.license.type %@> <@%- pkg.config.startYear %@><@% if (new Date().getFullYear() > pkg.config.startYear) { %@>-<@%- new Date().getFullYear() %@><@% } %@><@% if (pkg.license.url) { %@> (<@%- pkg.license.url %@>)<@% } %@>',
  ' */\n'
].join('\n'))({ pkg: pkg });

const pkgPaths = pkg.config.paths || {};
const PATH_TEMP = pkgPaths.tmp || '.tmp';
const PATH_APP = pkgPaths.app || 'app';
const PATH_DIST = pkgPaths.dist || 'dist';
const PATH_DIST_STATIC = pkgPaths['dist-static'] || 'dist-static';

// Public tasks

gulp.task('inject', gulp.series(gulp.parallel(injectStylesBower, injectScriptsBower), gulp.parallel(injectStyles, injectScripts)));
gulp.task('serve', gulp.series('inject', gulp.parallel(<% if (useTemplateLanguage) { -%>views, <% } %>styles, <% if (includeBabel || useAngular1) { -%>scripts, <% } %><% if (includeModernizr) { -%>modernizr, <% } %>fonts), watch));
gulp.task('build', gulp.series(clean, 'inject', gulp.parallel(<% if (useTemplateLanguage) { %>views, <% } -%>styles, <% if (includeBabel || useAngular1) { %>scripts, <% } %><% if (includeModernizr) { -%>modernizr, <% } %>fonts, lint, images, extras), html, optimize, info));
gulp.task('build').description = 'an example of build task: `$ gulp build --dist mangle,htmlmin,static,inline`';
gulp.task('default', gulp.task('serve'));
gulp.task(serveDist);
gulp.task(serveTest<% if (includeBabel) { -%>, gulp.task(scripts)<% } -%>);
gulp.task(deploy);
gulp.task(clean);
gulp.task(info);

// Private tasks

function styles () {
  return gulp.src(`${PATH_APP}/styles/*.scss`)
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe($.postcss([
      require('autoprefixer')({browsers: ['> 1%', 'last 2 versions', 'ie 8']}),
      require('css-mqpacker')({sort: true})
    ]))
    .pipe($.if(IS_DIST, $.base64({
      extensions: ['svg', 'png', 'gif', /\.jpg#datauri$/i],
      // exclude:    [/\.server\.(com|net)\/dynamic\//, '--live.jpg'],
      // maxImageSize: 8*1024, // bytes
      debug: true
    })))
    .pipe($.if(IS_DIST, $.replace(LICENSE_PLACEHOLDER, banner)))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest(`${PATH_TEMP}/styles`))
    .pipe($.if(IS_DIST, manageCss('/styles')()))
    .pipe(reload({stream: true}));
}

<% if (includeBabel || useAngular1) { -%>
function scripts () {
  return gulp.src(`${PATH_APP}/scripts/**/*.js`)
<% if (includeBabel) { -%>
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.babel())
    .pipe($.sourcemaps.write('.'))
<% } if (useAngular1) { -%>
    .pipe($.ngAnnotate())
<% } -%>
    .pipe(gulp.dest(`${PATH_TEMP}/scripts`))<% if (includeBabel || useAngular1) { %>
    .pipe(reload({stream: true}))<% } %>;
}

<% } -%>
<% if (includeModernizr) { -%>
function modernizr () {
  var fs = require('fs');
  return gulp.src(`${PATH_APP}/scripts/vendor.modernizr.json`) // dummy
    .pipe($.modernizr('vendor.modernizr.js',
      JSON.parse(fs.readFileSync(`${PATH_APP}/scripts/vendor.modernizr.json`))))
    .pipe($.if(IS_DIST, $.uglify({ preserveComments: (node, comment) => {
      return /\*.modernizr v/g.test(comment.value) || LICENSE_PLACEHOLDER === comment.value;
    }})))
    .pipe(gulp.dest(`${PATH_TEMP}/scripts`))
    .pipe(reload({stream: true}));
}

<% } -%>
function _lintBase(files, options) {
  return gulp.src(files)
    .pipe(reload({stream: true, once: true}))
    .pipe($.eslint(options))
    .pipe($.eslint.format())
    .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
}

function lint () {
  return _lintBase(`${PATH_APP}/scripts/**/*.js`, {
      fix: true
    })
    .pipe(gulp.dest(`${PATH_APP}/scripts`));
}

function lintTest () {
  return _lintBase('test/spec/**/*.js', {
    fix: true,
    env: {
<% if (testFramework === 'mocha') { -%>
      mocha: true
<% } else if (testFramework === 'jasmine') { -%>
      jasmine: true
<% } -%>
    }
  })
    .pipe(gulp.dest('test/spec'));
}

function manageCss (path) {
  return lazypipe()
<% if (includeUncss) { -%>
    .pipe(() => {
      return $.if(UNCSS, $.uncss({
        html: [`${PATH_APP}/*.html`, `${PATH_TEMP}/*.html`],
        ignoreSheets: '/bower_components/g'
      }));
    })
<% } -%>
    .pipe(() => { return $.if(DIST_STATIC, gulp.dest(PATH_DIST_STATIC + path)); })
    .pipe($.cssnano, { safe: true, autoprefixer: false })
    .pipe(gulp.dest, PATH_DIST + path)
    .pipe($.rename, { suffix: '.min' })
    .pipe(() => { return $.if(DIST_STATIC, gulp.dest(PATH_DIST_STATIC + path)); });
}

function manageJs () {
  // https://github.com/mishoo/UglifyJS2#the-simple-way
  var uglifyOpts = {
    preserveComments: 'license', // 'some'
    outSourceMap: true,
    toplevel: true,
    mangle: true,
    compress: {
      unsafe: true,
      drop_console: true,
      global_defs: {
        DEBUG: false
      }
    }
  };
  if (MANGLE_JS) {
    uglifyOpts.mangleProperties = {
      regex: /^_(?!format|default|value|toggleActive|process)(.+)/,
    };
  }
  return lazypipe()
    .pipe($.replace, LICENSE_PLACEHOLDER, banner)
    .pipe(() => { return $.if(DIST_STATIC, gulp.dest(PATH_DIST_STATIC)); })
<% if (useAngular1) { -%>
    .pipe($.ngAnnotate)
<% } -%>
    .pipe($.uglify, uglifyOpts)
    .pipe($.replace, LICENSE_PLACEHOLDER, banner)
    .pipe(gulp.dest, PATH_DIST)
    .pipe($.rename, { suffix: '.min' })
    .pipe(() => { return $.if(DIST_STATIC, gulp.dest(PATH_DIST_STATIC)); });
}

function manageHTML () {
  return lazypipe()
    .pipe(() => {
      return $.if(MINIFY_HTML, $.htmlmin({ removeComments: true, loose: false, minifyJS: true, minifyCSS: true, collapseWhitespace: true<% if (useAngular1) { -%>, processScripts: ['text/ng-template']<% } -%> }), $.prettify({ indent_size: 2, extra_liners: [] }));
    });
}

function images () {
  return gulp.src(`${PATH_APP}/images/**/*`)
    .pipe($.cache($.imagemin()))
    .pipe(gulp.dest(`${PATH_DIST}/images`));
}

function fonts () {
  return gulp.src(require('main-bower-files')('**/*.{eot,svg,ttf,woff,woff2}', () => {})
    .concat(`${PATH_APP}/fonts/**/*`))
    .pipe(gulp.dest(`${PATH_TEMP}/fonts`))
    .pipe(gulp.dest(`${PATH_DIST}/fonts`));
}

function extras () {
  return gulp.src([
<% if (!useTemplateLanguage) { -%>
    `!${PATH_APP}/*.html`,
<% } else { -%>
    `!${PATH_APP}/*.<%= tplLangExt %>`,
    `!${PATH_APP}/layouts`,
<% } -%>
    `${PATH_APP}/data/**/*.json`
  ], {
    dot: true,
    base: PATH_APP
  }).pipe(gulp.dest(PATH_DIST));
}

function injectStyles () {
  return gulp.src([`${PATH_APP}/styles/*.scss`, `!${PATH_APP}/styles/_*.scss`, `${PATH_APP}/styles/_config.imports.scss`])
    .pipe($.inject(gulp.src([`${PATH_APP}/styles/_*.scss`, `!${PATH_APP}/styles/_config.*.scss`],
      { read: false }), {
        relative: true,
        empty: true,
        name: 'injectApp',
        starttag: '// {{name}}:{{ext}}',
        endtag: '// endinject',
        transform: function (filepath, file) {
          return '@import "' + file.stem.substr(1, file.stem.length) + '";';
        } }))
    .pipe(gulp.dest(`${PATH_APP}/styles`))
    .pipe(reload({stream: true}));
}

function injectScripts () {
<% if (useTemplateLanguage) { -%>
  return gulp.src(`${PATH_APP}/_base.<%= tplLangExt %>`)
<% } else { -%>
  return gulp.src(`${PATH_APP}/index.html`)
<% } -%>
    .pipe($.inject(gulp.src([`${PATH_APP}/scripts/**/*.js`, `!${PATH_APP}/scripts/**/vendor.*.js`]<% if (!useAngular1) { -%>, { read: false }<% } -%>)<% if (useAngular1) { %>
        .pipe($.angularFilesort())<% } %>, { relative: true }))
    .pipe($.inject(gulp.src(`${PATH_APP}/scripts/**/vendor.*.js`,
      { read: false }), { relative: true, empty: true, name: 'injectAppCustomVendors' }))
    .pipe(gulp.dest(PATH_APP))
    .pipe(reload({stream: true}));
}

function injectStylesBower () {
  return gulp.src([`${PATH_APP}/styles/*.scss`, `!${PATH_APP}/styles/_*.scss`, `${PATH_APP}/styles/_config.imports.scss`])
    .pipe(wiredep({
<% if (includeBootstrap) { -%>
      exclude: ['bootstrap-sass'],
<% } -%>
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest(`${PATH_APP}/styles`))
    .pipe(reload({stream: true}));
}

function injectScriptsBower () {
  return gulp.src(`${PATH_APP}/*.<%= tplLangExt %>`)
    .pipe(wiredep({
<% if (includeBootstrap) { -%>
      exclude: ['bootstrap-sass'],
<% } -%>
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest(PATH_APP))
    .pipe(reload({stream: true}));
}

<% if (useTemplateLanguage) { -%>
function views () {
  var extend = require('extend');
  var fs = require('fs');
  var path = require('path');

  return gulp.src([`${PATH_APP}/*.<%= tplLangExt %>`, `!${PATH_APP}/_*.<%= tplLangExt %>`])
    .pipe($.data((file) => {
      var data = {
        common: JSON.parse(fs.readFileSync(`./${PATH_APP}/data/_common.json`)),
        dummy: JSON.parse(fs.readFileSync(`./${PATH_APP}/data/_dummy.json`))
      };
      var dataFilePath = `./${PATH_APP}/data/` + path.basename(file.path, '.<%= tplLangExt %>') + '.json';
      try {
        return extend(data, JSON.parse(fs.readFileSync(dataFilePath)));
      } catch(e) {
        $.util.log($.util.colors.yellow('A data file specific for this template is missing at: ' + dataFilePath));
        return data;
      }
    }))
<% if (useNunjucks) { -%>
    .pipe($.nunjucksRender({
      path: PATH_APP
    }))
<% } -%>
    .pipe(gulp.dest(PATH_TEMP));
}

<% } -%>
function info () {
  var infoTpl = ['',
    'Repository: <@%- data.repo %@>',
    '',
    'Pages Preview<@% data.pages.forEach(function (page) { %@>',
    '  <@%- page.title %@>: <@%- page.url %@><@% }) %@>',
    '',
    'Static Files Sources',
    '  Styles: <@%- data.pathStaticStyles %@>',
    '  Scripts: <@%- data.pathStaticScripts %@>',
    '',
    'Data Source',
    '  <@%- data.pathData %@>'
  ].join('\n');
  var pathRepo = pkg.repository.url;
  var pathMaster = pathRepo + '/tree/master';
  var path = require('path');
  var fs = require('fs');
  var filterExt = /\.html$/;
  var capitalize = function (s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  // @credit http://stackoverflow.com/a/25462405/1938970
  var fromDir = function (startPath, filter, callback) {
    if (!fs.existsSync(startPath)) {
      $.util.log($.util.colors.bgMagenta('no dir: "' + startPath + '"'));
      return;
    }
    var files = fs.readdirSync(startPath);
    for (var i = 0; i < files.length; i++) {
      var filename = path.join(startPath,files[i]);
      var stat = fs.lstatSync(filename);
      if (stat.isDirectory()){
        fromDir(filename, filter, callback);
      }
      else if (filter.test(filename)) {
        callback(files[i]);
      }
    }
  };
  var getPages = function () {
    var pages = [];
    fromDir(PATH_DIST, filterExt, function (filename) {
      var title;
      var url;
      if (filename === 'index.html') {
        title = 'Home';
        url = pkg.repository.preview;
      } else {
        title = capitalize(filename.replace(filterExt, ''));
        url = pkg.repository.preview + filename;
      }
      pages.push({ title: title, url: url });
    });
    return pages;
  };
  var data = {
    repo: pathRepo,
    pages: getPages(),
    pathStaticStyles: `${pathMaster}/${PATH_DIST_STATIC}/styles`,
    pathStaticScripts: `${pathMaster}/${PATH_DIST_STATIC}/scripts`,
    pathData: `${pathMaster}/${PATH_APP}/data`
  };

  $.util.log($.util.colors.green((tpl(infoTpl)({ data: data }))));

  return gulp.src(`${PATH_DIST}/**/*`).pipe($.size({title: 'build', gzip: true}));
}

function html () {
<% if (useTemplateLanguage) { -%>
  return gulp.src([`${PATH_APP}/*.html`, `${PATH_TEMP}/*.html`])
<% } else { -%>
  return gulp.src(`${PATH_APP}/*.html`)
<% } -%>
    .pipe($.useref({searchPath: [`${PATH_TEMP}`, `${PATH_APP}`, '.']}))
    .pipe($.if('*.css', manageCss('')()))
    .pipe($.if('*.js', manageJs()()))
    .pipe($.if('*.html', manageHTML()()))
    .pipe($.if('*.html', gulp.dest(PATH_DIST)));
}

function optimize () {
  return gulp.src(`${PATH_DIST}/*.html`)
    .pipe($.if(INLINE_EVERYTHING, $.inlineSource()))
    .pipe($.if(CACHE_BUST, $.cacheBust()))
    .pipe(gulp.dest(`${PATH_DIST}`));
}

function clean () {
  return del.bind(null, [`${PATH_TEMP}`, `${PATH_DIST}`])();
}

function server (baseDir, routes) {
  browserSync({
    notify: false,
    port: 9000,
    open: (!!argv.o || !!argv.open) || false,
    server: {
      baseDir: baseDir,
      routes: routes
    }
  });
}

function watch () {
  server([`${PATH_TEMP}`, `${PATH_APP}`], { '/bower_components': 'bower_components' });

  // watch for changes
  gulp.watch([
<% if (!useTemplateLanguage) { -%>
    `${PATH_APP}/*.html`,
<% } if (useTemplateLanguage) { -%>
    `${PATH_TEMP}/*.html`,
<% } -%>
    `${PATH_APP}/images/**/*`,
    `${PATH_TEMP}/fonts/**/*`
  ]).on('change', reload);

<% if (useTemplateLanguage) { -%>
  gulp.watch([`${PATH_APP}/data/*.json`, `${PATH_APP}/*.<%= tplLangExt %>`, `${PATH_APP}/layouts/**/*.<%= tplLangExt %>`]).on('all', views);
<% } -%>
  gulp.watch(`${PATH_APP}/styles/**/*.scss`).on('all', styles);
  gulp.watch(`${PATH_APP}/scripts/**/*.js`).on('all', <% if (includeBabel || useAngular1) { -%>scripts<% } else { %>reload<% } %>);
<% if (includeModernizr) { -%>
  gulp.watch(`${PATH_APP}/scripts/vendor.modernizr.json`).on('all', modernizr);
<% } -%>
  gulp.watch(`${PATH_APP}/fonts/*.*`).on('all', fonts);
  gulp.watch(`${PATH_APP}/scripts/**/*.js`).on('add', injectScripts);
  gulp.watch(`${PATH_APP}/scripts/**/*.js`).on('unlink', injectScripts);
  gulp.watch(`${PATH_APP}/styles/**/*.scss`).on('add', injectStyles);
  gulp.watch(`${PATH_APP}/styles/**/*.scss`).on('unlink', injectStyles);
  gulp.watch('bower.json').on('all', gulp.parallel(injectScriptsBower, injectStylesBower, fonts));
}

function serveDist() {
  server(`${PATH_DIST}`);
}

function serveTest() {
  server('test', {<% if (includeBabel) { -%>'/scripts': `${PATH_TEMP}/scripts`,<% } else { -%>'/scripts': `${PATH_APP}/scripts`,<% } -%> '/bower_components': 'bower_components' });
  gulp.watch('test/spec/**/*.js').on('change', reload);
  gulp.watch('test/spec/**/*.js').on('all', lintTest);
<% if (includeBabel) { -%>
  gulp.watch(`${PATH_APP}/scripts/**/*.js`).on('change', scripts);
<% } -%>
}

<% if (deploy) { -%>
function deploy () {
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
  return gulp.src(`${PATH_DIST}/**`, {
      base: `${PATH_DIST}`,
      buffer: false
    })
<% if (deploy === 'sftp') { -%>
    .pipe($.sftp({
      host: secrets.ftp.host,
      user: secrets.ftp.user,
      passphrase: secrets.ssh.passphrase,
      remotePath: secrets.ftp.publicPath  + '/' + pkg.name + '/'
    }));
<% } else if (deploy === 'ftp') { -%>
    .pipe(conn.newer('/public_html/' + pkg.name))
    .pipe(conn.dest('/public_html/' + pkg.name));
<% } -%>
}

<% } -%>