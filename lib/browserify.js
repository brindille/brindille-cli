var fs = require('fs')
var browserify = require('browserify')
var watchify = require('watchify')
var chalk = require('chalk')
var UglifyJS = require('uglify-js')
var mkdirp = require('mkdir-p')
var watchifyMiddleWare = require('watchify-middleware')

var bundler = null
var watcher = null
var middleware = null
var localDirectory = '/public/build'
var fileName = 'build.js'
var directory = process.cwd() + localDirectory
var output = directory + '/' + fileName
var localOutput = localDirectory + '/' + fileName
var isProd = false
var logPrefix = chalk.dim('[') + chalk.red('js') + chalk.dim(']  ')

function browserifyTask (entry, options, logger) {
  isProd = options.isProd
  if (options.o) {
    output = options.o
  }

  logger.info('\nLaunching', chalk.gray('browserify'), chalk.dim(isProd ? 'build' : 'watch'))

  mkdirp(directory, err => {
    if (err) logger.error(err)
    else onReady(entry, options, logger)
  })
}

function onReady (entry, options, logger) {
  bundler = browserify(entry, {
    cache: {},
    debug: !isProd,
    transform: options.transforms,
    packageCache: {}
  })

  if (isProd) startProd(logger)
  else startWatch(logger)
  
}

function startWatch (logger) {
  watcher = watchifyMiddleWare.emitter(bundler)

  watcher.on('log', e => {
    if (e.elapsed) onTime(logger, e.elapsed)
  })

  watcher.on('error', err => {
    logger.error(logPrefix + chalk.red(err.message))
  })

  watcher.on('update', (contents, row) => {
    const writeStream = fs.createWriteStream(output)
    writeStream.write(contents)
    writeStream.end('end')
  })
}

function startProd (logger) {
  const startTime = Date.now()
  bundler.bundle((err, buf) => {
    if (err) logger.error(logPrefix + chalk.red(err))
  }).pipe(fs.createWriteStream(output))
    .on('error', err => {
      logger.error(logPrefix + chalk.red(err))
    })
    .on('finish', () => {
      fs.writeFile(output, UglifyJS.minify(output, {
        output: {
          max_line_len: 120000
        }
      }).code, () => {
        onTime(logger, Date.now() - startTime)
      })
    })
}

function onTime (logger, time) {
  const msg = isProd ? 'bundled and minified ' : 'bundled '
  logger.info(
    logPrefix +
    chalk.gray(msg) +
    chalk.yellow(localOutput) +
    chalk.dim(' in ') +
    chalk.blue(time) +
    chalk.dim(' ms')
  )
}

module.exports = browserifyTask
