// generated on <%= generatedOn %> using <%= generatorName %> <%= generatorVersion %>
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import del from 'del';
import {stream as wiredep} from 'wiredep';
import lazypipe from 'lazypipe';
import minimist from 'minimist';
import tpl from 'lodash.template';
import pkg from './package.json';

const $ = gulpLoadPlugins();
const reload = browserSync.reload;
const argv = minimist(process.argv.slice(2));
const LICENSE_PLACEHOLDER = '/*! @license credits */';
const IS_DIST = !!argv.dist || !!argv.d;
<% if (includeUncss) { -%>
const UNCSS = typeof argv.dist === 'string' ? argv.dist.split(',').indexOf('uncss') !== -1 : false;
<% } -%>
const MINIFY_HTML = typeof argv.dist === 'string' ? argv.dist.split(',').indexOf('htmlmin') !== -1 : false;
const DIST_STATIC = typeof argv.dist === 'string' ? argv.dist.split(',').indexOf('static') !== -1 : false;
const banner = tpl([
  '/*!',
  ' * <@%- pkg.config.namePretty %@> v<@%- pkg.version %@> (<@%- pkg.homepage %@>)',
  ' * <@%- pkg.description %@>',
  ' *',
  ' * by <@%- pkg.author.name %@> <<@%- pkg.author.email %@>> (<@%- pkg.author.url %@>)',
  ' * <@%- pkg.license.type %@> <@%- pkg.config.startYear %@><@% if (new Date().getFullYear() > pkg.config.startYear) { %@>-<@%- new Date().getFullYear() %@><@% } %@><@% if (pkg.license.url) { %@> (<@%- pkg.license.url %@>)<@% } %@>',
  ' */\n'
].join('\n'))({ pkg: pkg });

gulp.task('styles', () => {
  return gulp.src('app/styles/*.scss')
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

gulp.task('scripts', () => {
<% if (includeModernizr) { -%>
  var modernizrConf = require('./app/scripts/modernizr.json');
  delete modernizrConf.dest;
<% } if (includeModernizr || includeBabel) { -%>
  return gulp.src('app/scripts/**/*.js')
<% } if (includeModernizr) { -%>
    // prepare the custom build @ https://modernizr.com/download
    .pipe($.modernizr(modernizrConf))
    .pipe($.if(IS_DIST, $.uglify({ preserveComments: (node, comment) => {
      return /\*.modernizr v/g.test(comment.value) || LICENSE_PLACEHOLDER === comment.value;
    }})))
<% } if (includeBabel) { -%>
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.babel())
    .pipe($.sourcemaps.write('.'))
<% } -%>
    .pipe(gulp.dest('.tmp/scripts'))
<% if (includeBabel) { -%>
    .pipe(reload({stream: true}));
<% } -%>
});

function lint(files, options) {
  return () => {
    return gulp.src(files)
      .pipe(reload({stream: true, once: true}))
      .pipe($.eslint(options))
      .pipe($.eslint.format())
      .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
  };
}
const testLintOptions = {
  env: {
<% if (testFramework === 'mocha') { -%>
    mocha: true
<% } else if (testFramework === 'jasmine') { -%>
    jasmine: true
<% } -%>
  }
};

gulp.task('lint', lint('app/scripts/**/*.js'));
gulp.task('lint:test', lint('test/spec/**/*.js', testLintOptions));

const cssOptimization = lazypipe()
<% if (includeUncss) { -%>
  .pipe(() => {
    return $.if(UNCSS, $.uncss({
      html: ['app/*.html', '.tmp/*.html'],
      ignoreSheets: '/bower_components/g'
    }));
  })
<% } -%>
  .pipe(() => { return $.if(DIST_STATIC, gulp.dest('dist-static')); })
  .pipe($.cssnano, { safe: true })
  .pipe(() => { return $.if(DIST_STATIC, gulp.dest('dist')); })
  .pipe(() => { return $.if(DIST_STATIC, $.rename({ suffix: '.min' })); })
  .pipe(() => { return $.if(DIST_STATIC, gulp.dest('dist-static')); })

const jsOptimization = lazypipe()
  .pipe(() => { return $.if(DIST_STATIC, $.replace(LICENSE_PLACEHOLDER, banner)); })
  .pipe(() => { return $.if(DIST_STATIC, gulp.dest('dist-static')); })
  .pipe($.uglify, { preserveComments: 'some', compress: { drop_console: true } })
  .pipe($.replace, LICENSE_PLACEHOLDER, banner)
  .pipe(() => { return $.if(DIST_STATIC, gulp.dest('dist')); })
  .pipe(() => { return $.if(DIST_STATIC, $.rename({ suffix: '.min' })); })
  .pipe(() => { return $.if(DIST_STATIC, gulp.dest('dist-static')); })

const htmlOptimization = lazypipe()
  .pipe(() => {
    return $.if(MINIFY_HTML, $.htmlmin({ removeComments: true, loose: true, minifyJS: true, minifyCSS: true, collapseWhitespace: true }), $.prettify({ indent_size: 2, extra_liners: [] }));
  });

<% if (useTemplateLanguage) { -%>
gulp.task('html', ['styles', 'scripts', 'views'], () => {
  return gulp.src(['app/*.html', '.tmp/*.html'])
<% } else { -%>
gulp.task('html', ['styles', 'scripts'], () => {
  return gulp.src('app/*.html')
<% } -%>
    .pipe($.useref({searchPath: ['.tmp', 'app', '.']}))
    .pipe($.if('*.css', cssOptimization()))
    .pipe($.if('*.js', jsOptimization()))
    .pipe($.if('*.html', htmlOptimization()))
    .pipe(gulp.dest('dist'));
});

gulp.task('images', () => {
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

gulp.task('fonts', () => {
  return gulp.src(require('main-bower-files')('**/*.{eot,svg,ttf,woff,woff2}', (err) => {})
    .concat('app/fonts/**/*'))
    .pipe(gulp.dest('.tmp/fonts'))
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('extras', () => {
  return gulp.src([
    'app/*.*',
<% if (!useTemplateLanguage) { -%>
    '!app/*.html',
<% } else { -%>
    '!app/*.<%= tplLangExt %>'
<% } -%>
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

<% if (useTemplateLanguage) { -%>
gulp.task('serve', ['views', 'styles', 'scripts', 'fonts'], () => {
<% } else { -%>
gulp.task('serve', ['styles', 'scripts', 'fonts'], () => {
<% } -%>
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
<% if (includeBabel) { -%>
  gulp.watch('app/scripts/**/*.js', ['scripts']);
<% } -%>
<% if (includeModernizr) { -%>
  gulp.watch('app/scripts/modernizr.json', ['scripts']);
<% } -%>
  gulp.watch('app/fonts/*.*', ['fonts']);
  gulp.watch('bower.json', ['wiredep', 'fonts']);
});

gulp.task('serve:dist', () => {
  browserSync({
    notify: false,
    open: (!!argv.o || !!argv.open) || false,
    port: 9000,
    server: {
      baseDir: ['dist']
    }
  });
});

<% if (includeBabel) { -%>
gulp.task('serve:test', ['scripts'], () => {
<% } else { -%>
gulp.task('serve:test', () => {
<% } -%>
  browserSync({
    notify: false,
    port: 9000,
    ui: false,
    server: {
      baseDir: 'test',
      routes: {
<% if (includeBabel) { -%>
        '/scripts': '.tmp/scripts',
<% } else { -%>
        '/scripts': 'app/scripts',
<% } -%>
        '/bower_components': 'bower_components'
      }
    }
  });

<% if (includeBabel) { -%>
  gulp.watch('app/scripts/**/*.js', ['scripts']);
<% } -%>
  gulp.watch('test/spec/**/*.js').on('change', reload);
  gulp.watch('test/spec/**/*.js', ['lint:test']);
});

// inject bower components
gulp.task('wiredep', () => {
  gulp.src('app/styles/*.scss')
    .pipe(wiredep({
<% if (includeBootstrap) { -%>
      exclude: ['bootstrap-sass'],
<% } -%>
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('app/styles'));

  return gulp.src('app/*.<%= tplLangExt %>')
    .pipe(wiredep({<% if (includeBootstrap) { %>
      exclude: ['bootstrap-sass'],<% } %>
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app'));
});

gulp.task('_build', ['lint', 'html', 'images', 'fonts', 'extras'], () => {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

// an example of build task: `$ gulp build -dist htmlmin,<%= includeUncss ? 'uncss' : '' -%>`
gulp.task('build', ['clean'], () => {
  gulp.start('_build');
});

gulp.task('default', ['serve']);

<% if (useTemplateLanguage) { -%>
gulp.task('views', ['wiredep'], () => {
  var extend = require('extend');
  var fs = require('fs');
  var path = require('path');

  return gulp.src(['app/*.<%= tplLangExt %>', '!app/_*.<%= tplLangExt %>'])
    .pipe($.data((file) => {
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

gulp.task('deploy', () => {
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
