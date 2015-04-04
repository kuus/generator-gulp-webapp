# Web app generator [![Build Status](https://secure.travis-ci.org/yeoman/generator-gulp-webapp.svg?branch=master)](http://travis-ci.org/yeoman/generator-gulp-webapp)

Fork of `generator-gulp-webapp`, see [original repo](https://github.com/yeoman/generator-gulp-webapp).

## Diff from original
 - Use as default the [jade](http://jade-lang.com/) [official recipe](https://github.com/yeoman/generator-gulp-webapp/blob/master/docs/recipes/jade.md).
 - Implement a basic template inheritance pattern through jade.
 - Include only the desired Bootstrap scss components.
 - Javascript file `main.js` wrapped in a [IIFE](http://benalman.com/news/2010/11/immediately-invoked-function-expression/).
 - Add credits/copyright banners to compiled and minified css/js based on the `package.json` content.
 - Gulp default task is now `serve` instead of `build`.
 - Gulp `serve` task doesn't open a new tab unless a `--o` arg is given in the console (i.e. `gulp --o`).


## License

[BSD license](http://opensource.org/licenses/bsd-license.php)
