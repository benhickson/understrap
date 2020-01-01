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
import webpack from 'webpack';
import browserSync from "browser-sync";
const TerserPlugin = require('terser-webpack-plugin');
import path from 'path';

const PRODUCTION = yargs.argv.prod;
const WATCH = yargs.argv.watch;
const server = browserSync.create();

// Configuration file to keep your code DRY
var cfg = require('./gulpconfig.json');
var paths = cfg.paths;

export const styles = () => {
	return src([paths.devscss + '/theme.scss', paths.devscss + '/custom-editor-style.scss'])
		.pipe(gulpif(!PRODUCTION, sourcemaps.init({ loadMaps: true })))
		.pipe(sass({ includePaths: [paths.devscss, paths.node] }).on('error', sass.logError))
		.pipe(gulpif(PRODUCTION, postcss([autoprefixer])))
		.pipe(gulpif(PRODUCTION, cleanCss()))
		.pipe(gulpif(!PRODUCTION, sourcemaps.write()))
		.pipe(dest(paths.css))
		.pipe(server.stream());
}

export const watchForChanges = () => {
	watch(paths.devscss + '/**/*.scss', styles);
	watch(paths.imgsrc + '/**/*.{jpg,jpeg,png,svg,gif}', series(images, reload));
	watch('src/js/**/*.js', series(scripts, reload));
	watch("**/*.php", reload);
}

export const images = () => {
	return src(paths.imgsrc + '/**/*.{jpg,jpeg,png,svg,gif}')
		.pipe(gulpif(PRODUCTION, imagemin()))
		.pipe(dest(paths.img));
}

export const fonts = () => {
	return src(paths.devfonts + '/**/*.{eot,svg,ttf,woff,woff2}')
		.pipe(dest(paths.fonts));
}

export const clean = () => del(['dist']);

export const dist = (done) => {
	src([
		'**/*',
		'!' + paths.bower + '/**',
		'!' + paths.node + '/**',
		'!' + paths.vendor + '/**',
		'!' + paths.dev + '/**',
		'!' + paths.dist + '/**',
		'!*.js',
		'!*.json',
		'!*.lock',
		'!*.md',
		'!*.txt',
		'!*.xml',
	], { 'buffer': false, 'dot': false })
		//.pipe( replace( '/js/jquery.slim.min.js', '/js' + paths.vendor + '/jquery.slim.min.js', { 'skipBinary': true } ) )
		.pipe(dest(paths.dist));
	done();
}

export const scripts = () => {
	const webpackConfig = {
		entry: {
			theme: 'multi-entry-loader?include[]=' + paths.devjs + '/theme.js,include[]=' + paths.devjs + '/include/*.js!',
			customizer: paths.devjs + '/customizer.js'
		},
		module: {
			rules: [
				{ test: /\.js$/, loader: 'babel-loader'	}
			]
		},
		mode: PRODUCTION ? 'production' : 'development',
		devtool: !PRODUCTION ? 'inline-source-map' : false,
		optimization: {
			minimize: PRODUCTION ? true : false,
			minimizer: [new TerserPlugin({
				include: /\.js$/,
				terserOptions: {
					ie8: false,
					safari10: true,
				}
			})
			]
		},
		output: {
			filename: '[name].js',
			path: path.resolve(__dirname, paths.js),
		},
		externals: {
			jquery: 'jQuery'
		},
	}

	return new Promise((resolve, reject) => {
		webpack(webpackConfig, (err, stats) => {
				if (err) {
						return reject(err)
				}
				if (stats.hasErrors()) {
						return reject(new Error(stats.compilation.errors.join('\n')))
				}
				resolve()
		})
	})
}

export const serve = done => {
	server.init(
		cfg.browserSyncWatchFiles,
		cfg.browserSyncOptions);
	done();
};

export const reload = done => {
	server.reload();
	done();
};

export const dev = WATCH ? series(parallel(styles, images, scripts, fonts), serve, watchForChanges) : parallel(styles, images, scripts, fonts);
export const build = series(clean, parallel(styles, images, scripts, fonts), dist);

export default dev;