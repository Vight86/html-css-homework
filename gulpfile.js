
const {
  src, dest, series, parallel, watch,
} = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cssnano = require('gulp-cssnano');
const rename = require("gulp-rename");
const imagemin = require('gulp-imagemin');
const imgCompress = require('imagemin-jpeg-recompress');
const svgSprite = require('gulp-svg-sprite');
const browserSync = require('browser-sync').create();
const del = require('del');

sass.compiler = require('node-sass');

const source = 'src';
const build = 'docs';

function html(cb) {
  src(`${source}/*.html`)
    .pipe(dest(build));
  cb();
}

function styles(cb) {
  src(`${source}/*.scss`)
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({
      grid: 'autoplace',
    }))
    .pipe(cssnano())
    .pipe(rename({
      extname: '.min.css',
    }))
    .pipe(sourcemaps.write('./'))
    .pipe(dest(build));
  cb();
}

function imgBuild(cb) {
  src([`${source}/img/**/*.*`])
    .pipe(imagemin([
      imgCompress({
        loops: 4,
        min: 80,
        max: 90,
        quality: 'high',
      }),
      imagemin.gifsicle({
        interlaced: true,
        optimizationLevel: 5,
      }),
      imagemin.optipng({ optimizationLevel: 1 }),
      imagemin.svgo(),
    ]))
    .pipe(dest(`${build}/img`));
  cb();
}

function svgSpriteBuild(cb) {
  src(`${source}/icons/**/*.svg`)
    .pipe(svgSprite({
      shape: {
        transform: [
            {svgo: {
                plugins: [
                    { removeAttrs: { attrs: '(fill|stroke|style|class|id)' } },
                    {removeStyleElement: true}
                ]
            }}
        ]
    },
      mode: {
        symbol: {
          sprite: '../sprite.svg',
        },
      },
    }))
    .pipe(dest(`${build}/icons/`));

  cb();
}

function fonts(cb) {
  src(`${source}/fonts/*.*`)
    .pipe(dest(`${build}/fonts`));

  cb();
}

function server(cb) {
  browserSync.init({
    notify: false,
    server: {
      baseDir: build,
    },
  });
  cb();
}

function watcher(cb) {
  watch(`${source}/*.html`).on('change', series(html, browserSync.reload));
  watch(`${source}/**/*.scss`).on('change', series(styles, browserSync.reload));
  watch(`${source}/img/`).on('add', series(imgBuild, browserSync.reload));
  watch(`${source}/icons/`).on('add', series(svgSpriteBuild, browserSync.reload));
  watch(`${source}/fonts/**/*.*`).on('add', series(fonts, browserSync.reload));
  cb();
}

function clean() {
  return del(build);
}

exports.dev = series(clean, imgBuild, svgSpriteBuild, parallel(
  html, styles, fonts,
), server, watcher);

exports.build = series(clean, imgBuild, svgSpriteBuild, parallel(
  html, styles, fonts,
), server);
