# Web app generator [![Build Status](https://secure.travis-ci.org/kuus/generator-webapp.svg?branch=master)](http://travis-ci.org/kuus/generator-webapp) [![Gitter](https://img.shields.io/badge/Gitter-Join_the_Yeoman_chat_%E2%86%92-00d06f.svg)](https://gitter.im/yeoman/yeoman)

Fork of `generator-webapp`, see [original repo](https://github.com/yeoman/generator-webapp).

## Getting Started

- Clone this repo `git clone git@github.com:kuus/generator-webapp.git`
- Run `npm link` from within the cloned folder
- Done. Now to scaffold an app run `yo kuus-webapp`.

## Diff from original
 - Does not prompt for project name, it grabs it from the root folder name
 - Template language `nunjucks` ([docs](https://mozilla.github.io/nunjucks/)).
 - When a template language is used you can store content data outside the templates (in `data/` folder to mimic real data from DB.
 - Implement a basic template inheritance pattern through `nunjucks`.
 - Include only the desired Bootstrap scss components.
 - Inline small images and svg fonts in css (only with `-dist` arg), with [gulp-base64](https://www.npmjs.com/package/gulp-base64)
 - Combine media queries in css, with [css-mqpacker](https://www.npmjs.com/package/css-mqpacker).
 - Add credits/copyright banners to compiled and minified css/js based on the `package.json` content.
 - Optional new task `$ gulp deploy`, yeoman prompts to let you choose between `ftp` (with [vinyl-ftp](https://www.npmjs.com/package/vinyl-ftp)), `sftp` (with [gulp-sftp](https://www.npmjs.com/package/gulp-sftp)) or `none`.
 - Gulp default task is now `serve` instead of `build`.
 - Gulp `serve` task doesn't open a new tab unless a `-o` or `-open` arg is given in the console (i.e. `gulp -o`).
 - To build the `dist` version you need to pass an argument to the command, so: `$ gulp build -dist htmlmin,uncss`, where `htmlmin` and `uncss` (to clean unneded css with [gulp-uncss](https://www.npmjs.com/package/gulp-uncss)) are optional.
 - The HTML produced by the `$ gulp build -dist` task is by default prettified with [gulp-prettify](https://www.npmjs.com/package/gulp-prettify), passing the `htmlmin` arg it gets instead minified by [gulp-htmlmin](https://www.npmjs.com/package/gulp-htmlmin)
 - Option `static` to include styles and scripts minified and unminified in the folder `./dist-static`, use it like this: `$ gulp build -dist static`
 - Javascript file `main.js` wrapped in a [IIFE](http://benalman.com/news/2010/11/immediately-invoked-function-expression/)

## Todo
 - Populate the `_dummy.json` somehow, maybe with harcoded data or with some node module.
 - The data.json for each page, so for instance `index.json` might be a template that generates a custom json for that specific page.
 - Maybe use some remote mocked js API.
 - Do a generator for a new page, it will create a `pagename.(html,njk)` file in the root, a corresponding `data/pagename.json` with content data and a `style/page--pagename.scss` module.

## License

[BSD license](http://opensource.org/licenses/bsd-license.php)
