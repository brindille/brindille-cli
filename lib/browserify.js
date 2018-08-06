const fs = require('fs')
const browserify = require('browserify')
const chalk = require('chalk')
const UglifyJS = require('uglify-js')
const mkdirp = require('mkdir-p')
const watchifyMiddleWare = require('watchify-middleware')
const errorHandler = require('./utils/errorHandler')
const lint = require('./lint')

const logPrefix = chalk.dim('[') + chalk.red('js') + chalk.dim(']  ')
let fileName = 'build.js'

let localDirectory = '/public/build'
let directory = ''
let localOutput = ''
let localOutputs = []
let output = ''
let outputs = []

let bundler = null
let bundlers = []
let isProd = false
let watchers = []
let savedErrors = []

function browserifyTask (entries, options, loggers) {
  if (typeof entries === String) manageBrowserifyTask(entries, options, loggers, 0)
  else entries.forEach((entry, index) => { manageBrowserifyTask(entry, options[index], loggers[index], index) })
}

function manageBrowserifyTask (entry, options, logger, index) {
  isProd = options.isProd
  if (options.output) {
    localDirectory = '/' + options.output
  }
  if (options.fileName) {
    fileName = options.fileName
  }
  directory = process.cwd() + localDirectory
  localOutput = localDirectory + '/' + fileName
  localOutputs[index] = localOutput
  output = directory + '/' + fileName
  outputs[index] = output

  logger.info('\nLaunching', chalk.gray('browserify'), chalk.dim(isProd ? 'build' : 'watch'))
  mkdirp(directory, err => {
    if (err) logger.error(err)
    else onReady(entry, options, logger, index)
  })
}

function onReady (entry, options, logger, index) {
  bundler = browserify(entry, {
    cache: {},
    debug: !isProd,
    transform: options.transforms,
    packageCache: {}
  })
  bundlers[index] = bundler
  lint.all(logger, outputs[index], errors => {
    if (isProd) {
      if (errors.length === 0) startProd(logger, index)
    } else {
      savedErrors = errors
      startWatch(logger, errors.length > 0, index)
    }
  })
}

function startWatch (logger, lintError, index) {
  let pendingLogTime = false
  // watcher = watchifyMiddleWare.emitter(bundler)
  watchers[index] = watchifyMiddleWare.emitter(bundlers[index])
  const saveToFile = content => {
    const writeStream = fs.createWriteStream(outputs[index])
    writeStream.write(content)
    writeStream.end()
  }

  const tryToLogTime = () => {
    if (pendingLogTime) {
      onTime(logger, pendingLogTime, index)
      pendingLogTime = false
    }
  }

  const onLinted = (error, contents) => {
    if (!error) {
      tryToLogTime()
      saveToFile(contents)
    }
  }
  watchers[index].on('log', e => {
    pendingLogTime = e.elapsed
  })

  watchers[index].on('error', err => {
    logger.error(logPrefix + chalk.red(err.message))
    const writeStream = fs.createWriteStream(outputs[index])
    writeStream.write(errorHandler.compilationError(err.message))
    writeStream.end()
  })

  watchers[index].on('update', (contents, row) => {
    if (row.length === 0) {
      onLinted(lintError, contents)
    } else {
      lint.some(logger, outputs[index], row, savedErrors, errors => {
        savedErrors = errors
        onLinted(errors.length > 0, contents)
      })
    }
  })
}

function startProd (logger, index) {
  const startTime = Date.now()
  
  // For now we don't use it as it breaks YAMLIFY
  // bundler.plugin('tinyify', {flat: false})
  bundler.bundle((err, buf) => {
    if (err) logger.error(logPrefix + chalk.red(err))
  }).pipe(fs.createWriteStream(outputs[index]))
    .on('error', err => {
      logger.error(logPrefix + chalk.red(err))
    })
    .on('finish', () => {
      fs.writeFile(outputs[index], UglifyJS.minify(outputs[index], {
        output: {
          max_line_len: 120000
        }
      }).code, () => {
        onTime(logger, Date.now() - startTime, index)
      })
    })
}

function onTime (logger, time, index) {
  const msg = isProd ? 'bundled and minified ' : 'bundled '
  logger.info(
    logPrefix +
    chalk.gray(msg) +
    chalk.yellow(localOutputs[index]) +
    chalk.dim(' in ') +
    chalk.blue(time) +
    chalk.dim(' ms')
  )
}

module.exports = browserifyTask
