'use strict';

/*
 * arguments
 * - production
 */

// CLI arguments
var argv = require('yargs').argv;

// gulp plugins
var gulp = require('gulp'),
    $ = require('gulp-load-plugins')();

// other libraries
var runSequence = require('run-sequence'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload,
    del = require('del');

// for browserify
var browserify = require('browserify'),
    watchify = require('watchify'),
    source = require('vinyl-source-stream');

// paths
var src = {
      self: './src',
      js: './src/javascript',
      css: './src/stylesheet',
      html: './src/html'
    },
    dist = {
      self: './dist',
      js: './dist/js',
      css: './dist/stylesheet',
      html: './dist/html'
    },
    jadeData = {
      self: './jade_data'
    };


/*
 * Others
 */
gulp.task('browser-sync', function(){
  browserSync({
    notify: false,
    server: {
      baseDir: dist.self,
      index: './html/index.html'
    }
  });
});

gulp.task('clean', function(){
  del([dist.self]);
});

/*
 * around JavaScript
 */
var MAIN_JS_FILE_NAME = 'main.js';
function scripts(watch) {
  var config = {debug: !argv.production, cache: {}, packageCache: {}, fullPaths: watch},
      bundler = browserify(src.js + '/' + MAIN_JS_FILE_NAME, config),
      rebundle = function() {
        return bundler.bundle().
          pipe(source(MAIN_JS_FILE_NAME)).
          pipe(gulp.dest(dist.js)).
          pipe(reload({stream: true, once: true}));
      };

  bundler = watch ? watchify(bundler) : bundler;
  bundler.on('update', rebundle);
  return rebundle();
}

gulp.task('uglify', function(){
  return gulp.src(dist.js + '/*.js').
    pipe($.uglify()).
    pipe(gulp.dest(dist.js));
});

gulp.task('jshint', function(){
  return gulp.src(src.js + '/*.js').
    pipe($.jshint('.jshintrc')).
    pipe($.jshint.reporter('jshint-stylish'));
});

gulp.task('browserify', function(){
  return scripts(false);
});

gulp.task('watchify', function(){
  return scripts(true);
});

/*
 * around CSS
 */
gulp.task('minify-css', function(){

});

/*
 * around HTML
 */
gulp.task('templates', function(){
  var getJsonData = function(file){
    var gulpEnv = argv.production ? 'production' : 'development',
        jsonPath = [jadeData.self, gulpEnv].join('/') + '.json';
    return require(jsonPath);
  };

  return gulp.src(src.html + '/*.jade').
    pipe($.data(getJsonData())).
    pipe($.jade({
      pretty: !argv.production
    })).
    pipe(gulp.dest(dist.html));
});

/*
 * Main tasks
 */
gulp.task('default', function(){
  return runSequence(
    'clean',
    ['browserify', 'templates'],
    'uglify'
  );
});

gulp.task('watch', ['browser-sync', 'watchify'], function(){
  gulp.watch(src.js + '/*.js', ['jshint']);
  gulp.watch(src.html + '/*.jade', ['templates', reload]);
});
