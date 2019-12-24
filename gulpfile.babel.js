// Defining requirements
import { src, dest, watch, series, parallel } from 'gulp';
import yargs from 'yargs';
import sass from 'gulp-sass';
import cleanCss from 'gulp-clean-css';
import gulpif from 'gulp-if';
import sourcemaps from 'gulp-sourcemaps';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import imagemin from 'gulp-imagemin';
import del from 'del';
import webpack from 'webpack-stream';
import browserSync from "browser-sync";
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const PRODUCTION = yargs.argv.prod;
const server = browserSync.create();

// Configuration file to keep your code DRY
var cfg = require( './gulpconfig.json' );
var paths = cfg.paths;

export const styles = () => {
  return src([paths.devscss + 'theme.scss', paths.devscss + 'custom-editor-style.scss'])
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(gulpif(!PRODUCTION, sourcemaps.init()))
    .pipe(sass().on('error', sass.logError))
    .pipe(gulpif(PRODUCTION, postcss([ autoprefixer ])))
    .pipe(gulpif(PRODUCTION, cleanCss({compatibility:'ie8'})))
    .pipe(gulpif(!PRODUCTION, sourcemaps.write()))
    .pipe(dest(paths.css))
    .pipe(server.stream());
}

export const watchForChanges = () => {
    watch( paths.devscss+ '**/*.scss', styles);
    watch( paths.imgsrc + '**/*.{jpg,jpeg,png,svg,gif}', series(images, reload));
    watch('src/js/**/*.js', series(scripts, reload));
    watch("**/*.php", reload);
}

export const images = () => {
  return src(paths.imgsrc +'**/*.{jpg,jpeg,png,svg,gif}')
    .pipe(gulpif(PRODUCTION, imagemin()))
    .pipe(dest(paths.img));
}

export const copyAssets = (done) => {
  src(paths.node + 'bootstrap/dist/js/**/*.js')
  .pipe(dest(paths.devjs + 'bootstrap4'));

  src(paths.node + 'bootstrap/scss/**/*.scss')
  .pipe(dest(paths.devscss + 'bootstrap4'));

  src(paths.node + 'font-awesome/fonts/**/*.{ttf,woff,woff2,eot,svg}')
  .pipe(dest('./fonts'));

  src(paths.node + 'font-awesome/scss/*.scss')
  .pipe(dest(paths.devscss + 'fontawesome'));

  src(paths.node + 'popper.js/dist/popper.*js')
	.pipe(dest(paths.devjs + 'popper'));

  done();
}

export const clean = () => del(['dist']);

export const dist = (done) => {
  src( [
      '**/*',
      '!' + paths.bower,
      '!' + paths.bower + '/**',
      '!' + paths.node,
      '!' + paths.node + '/**',
      '!' + paths.dev,
      '!' + paths.dev + '/**',
      '!' + paths.dist,
      '!' + paths.dist + '/**',
      '!' + paths.distprod,
      '!' + paths.distprod + '/**',
      '!' + paths.sass,
      '!' + paths.sass + '/**',
      '!readme.txt',
      '!readme.md',
      '!package.json',
      '!package-lock.json',
      '!gulpfile.js',
      '!gulpconfig.json',
      '!CHANGELOG.md',
      '!.travis.yml',
      '!jshintignore',
      '!codesniffer.ruleset.xml',
      '*'
    ], { 'buffer': false } )
    //.pipe( replace( '/js/jquery.slim.min.js', '/js' + paths.vendor + '/jquery.slim.min.js', { 'skipBinary': true } ) )
    .pipe( dest( paths.dist ) );
    done();
}

export const scripts = () => {
  return src([paths.devjs + 'include/*.js', paths.devjs + 'theme.js'])
  .pipe(webpack({
    module: {
      rules: [
        {
          test: /\.js$/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: []
            }
          }
        }
      ]
    },
    mode: PRODUCTION ? 'production' : 'development',
    devtool: !PRODUCTION ? 'inline-source-map' : false,
    optimization: {
      minimize: true,
      minimizer: [new UglifyJsPlugin({
        include: /\.js$/
        })
      ]
    },
    output: {
      filename: 'theme.js'
    },
    externals: {
      jquery: 'jQuery'
    },
  }))
  .pipe(dest(paths.js));
}

export const serve = done => {
  server.init(
    cfg.browserSyncWatchFiles,
    cfg.browserSyncOptions );
  done();
};

export const reload = done => {
  server.reload();
  done();
};

export const dev = series(parallel(styles, images, scripts), serve, watchForChanges);
export const build = series(clean, parallel(styles, images, scripts, dist));

export default dev;