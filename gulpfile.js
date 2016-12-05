var gulp = require('gulp');
var ts = require('gulp-typescript');
var tslint = require('gulp-tslint');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var rename = require("gulp-rename");

var browserSync = require('browser-sync').create();

gulp.task('browserSync',function(){
	browserSync.init({
		server:{
			baseDir:'./dev'
		}
	})
})
gulp.task('tsLint',function(){
	return gulp.src('src/**/*.ts')
		.pipe(tslint({
			formatter:"verbose"
		}))
		.pipe(tslint.report())
})
gulp.task('ts',function(){
	return gulp.src('./src/**/*.ts')
		.pipe(sourcemaps.init())
		.pipe(ts({}))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('./dev'))
		.pipe(browserSync.reload({stream:true}))
})
gulp.task('watch',['ts','browserSync'],function(){
	gulp.watch('src/**/*.ts',['tsLint','ts'])
	gulp.watch('dev/*.html',browserSync.reload)
})
gulp.task('default',['watch'],function(){

})

gulp.task('deploy-ts',function(){
	return gulp.src('./src/**/*.ts')
		.pipe(ts({}))
		.pipe(gulp.dest('./dist'))
})
gulp.task('deploy-minify',['deploy-ts'],function(){
	return gulp.src('./dist/*.js')
		.pipe(uglify())
		.pipe(rename({ suffix: '.min' }))
		.pipe(gulp.dest('./dist'))
})
gulp.task('deploy',['deploy-ts','deploy-minify'],function(){
	console.log("done");
})