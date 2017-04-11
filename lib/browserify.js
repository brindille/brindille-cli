var fs = require('fs')
var browserify = require('browserify')
var watchify = require('watchify')
var chalk = require('chalk')
var UglifyJS = require('uglify-js')
var mkdirp = require('mkdir-p')

var b = null
var localDirectory = '/public/build'
var fileName = 'build.js'
var directory = process.cwd() + localDirectory
var output = directory + '/' + fileName
var localOutput = localDirectory + '/' + fileName

function browserifyTask (entry, options, logger) {
  const isProd = options.isProd
  if (options.o) {
    output = options.o
  }

  logger.info('\nLaunching', chalk.gray('browserify'), chalk.dim(isProd ? 'build' : 'watch'))

  mkdirp(directory, (err) => {
    if (err) logger.error(err)
    b = browserify({
      entries: [entry],
      cache: {},
      debug: !isProd,
      transform: options.transforms,
      packageCache: {},
      plugin: isProd ? [] : [watchify]
    })
    if (!isProd) {
      b.on('update', () => {
        bundle(logger)
      })
    }
    bundle(logger, isProd)
  })
}

function bundle (logger, isProd) {
  const startTime = Date.now()
  b.bundle().pipe(fs.createWriteStream(output)).on('finish', () => {
    if (isProd) {
      fs.writeFile(output, UglifyJS.minify(output).code, () => {
        onTime(logger, Date.now() - startTime, isProd)
      })
    } else {
      onTime(logger, Date.now() - startTime)
    }
  })
}

function onTime (logger, time, isProd) {
  const msg = isProd ? 'bundled and minified ' : 'bundled '
  logger.info(
    chalk.dim('[') +
    chalk.red('js') +
    chalk.dim(']  ') +
    chalk.gray(msg) +
    chalk.yellow(localOutput) +
    chalk.dim(' in ') +
    chalk.blue(time) +
    chalk.dim(' ms')
  )
}

module.exports = browserifyTask
