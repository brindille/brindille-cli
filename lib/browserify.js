const fs = require('fs')
const browserify = require('browserify')
const chalk = require('chalk')
const UglifyJS = require('uglify-js')
const mkdirp = require('mkdir-p')
const watchifyMiddleWare = require('watchify-middleware')
const errorHandler = require('./utils/errorHandler')
const lint = require('./lint')

const localDirectory = '/public/build'
const fileName = 'build.js'
const directory = process.cwd() + localDirectory
const localOutput = localDirectory + '/' + fileName
const logPrefix = chalk.dim('[') + chalk.red('js') + chalk.dim(']  ')

let output = directory + '/' + fileName
let bundler = null
let watcher = null
let isProd = false

let savedErrors = []

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
  lint.all(logger, output, errors => {
    if (isProd) {
      if (errors.length === 0) startProd(logger)
    } else {
      savedErrors = errors
      startWatch(logger, errors.length > 0)
    }
  })
}

function startWatch (logger, lintError) {
  let pendingLogTime = false

  watcher = watchifyMiddleWare.emitter(bundler)

  const saveToFile = content => {
    const writeStream = fs.createWriteStream(output)
    writeStream.write(content)
    writeStream.end()
  }

  const tryToLogTime = () => {
    if (pendingLogTime) {
      onTime(logger, pendingLogTime)
      pendingLogTime = false
    }
  }

  const onLinted = (error, contents) => {
    if (!error) {
      tryToLogTime()
      saveToFile(contents)
    }
  }

  watcher.on('log', e => {
    pendingLogTime = e.elapsed
  })

  watcher.on('error', err => {
    logger.error(logPrefix + chalk.red(err.message))
    const writeStream = fs.createWriteStream(output)
    writeStream.write(errorHandler.compilationError(err.message))
    writeStream.end()
  })

  watcher.on('update', (contents, row) => {
    if (row.length === 0) {
      onLinted(lintError, contents)
    } else {
      lint.some(logger, output, row, savedErrors, errors => {
        savedErrors = errors
        onLinted(errors.length > 0, contents)
      })
    }
  })
}

function startProd (logger) {
  const startTime = Date.now()
  
  // For now we don't use it as it breaks YAMLIFY
  // bundler.plugin('tinyify', {flat: false})
  
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
