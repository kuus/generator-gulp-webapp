# Web app generator [![Build Status](https://secure.travis-ci.org/yeoman/generator-gulp-webapp.svg?branch=master)](http://travis-ci.org/yeoman/generator-gulp-webapp)

Fork of `generator-gulp-webapp`, see [original repo](https://github.com/yeoman/generator-gulp-webapp).

## Diff from original
 - Template language choice between [swig](http://paularmstrong.github.io/swig/), [jade](http://jade-lang.com/) (kind of follows the [official recipe](https://github.com/yeoman/generator-gulp-webapp/blob/master/docs/recipes/jade.md)), and none.
 - When a template language is used you can store content data outside the templates (in `data/` folder to mimic real data from DB.
 - Implement a basic template inheritance pattern through jade and swig.
 - Include only the desired Bootstrap scss components.
 - Javascript file `main.js` wrapped in a [IIFE](http://benalman.com/news/2010/11/immediately-invoked-function-expression/).
 - Add credits/copyright banners to compiled and minified css/js based on the `package.json` content.
 - Gulp default task is now `serve` instead of `build`.
 - Gulp `serve` task doesn't open a new tab unless a `-o` arg is given in the console (i.e. `gulp -o`).

## Todo
 - Populate the `_dummy.json` somehow, maybe with harcoded data or with some node module.
 - The data.json for each page, so for instance `index.json` might be a template that generates a custom json for that specific page.
 - Maybe use some remote mocked js API.
 - Do a generator for a new page, it will create a `pageName.(html,jade,swig)` file in the root, a corresponding `data/pageName.json` with content data and a `style/page-pageName.scss` module.

## License

[BSD license](http://opensource.org/licenses/bsd-license.php)
