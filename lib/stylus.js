var fs = require('fs')
var chalk = require('chalk')
var stylus = require('stylus')
var chokidar = require('chokidar')
var autoprefixer = require('autoprefixer-stylus')
var fontFace = require('stylus-font-face')

const fileName = 'main.css'
let localDirectory = '/public/build'
let directory = ''
let output = ''
let localOutput = ''
let sourcemapOutput = ''
let outputPath = ''
let stylusFilename = ''

var time = 0
var style = null
var isProd = false

function stylusTask (entry, options, logger) {

  if (options.output) {
    localDirectory = '/' + options.output
  }
  directory = process.cwd() + localDirectory
  output = directory + '/' + fileName
  localOutput = localDirectory + '/' + fileName
  sourcemapOutput = output + '.map'
  outputPath = output.split('/')
  stylusFilename = outputPath[outputPath.length - 1]

  isProd = options.isProd
  logger.info('Launching', chalk.gray('stylus'), chalk.dim(isProd ? 'build' : 'watch') + '\n')
  if (!options.isProd) {
    chokidar.watch('src/**/*.styl').on('change', () => {
      bundle(entry)
    })
  }
  bundle(entry, options.isProd)
}

function bundle (file, isProd) {
  time = Date.now()
  const str = fs.readFileSync(file, 'utf8')
  style = stylus(str)
    .set('filename', stylusFilename)
    .set('paths', [process.cwd() + '/src/stylus'])
    .set('compress', isProd)
    .set('sourcemap', true)
    .use(autoprefixer())
    .use(fontFace({}))
  style.render(onRendered)
}

function onRendered (err, css) {
  if (err) console.log(err)
  fs.writeFile(output, css, onSaved)
  fs.writeFile(sourcemapOutput, JSON.stringify(style.sourcemap), onSourceMapSaved)
}

function onSourceMapSaved (err) {
  if (err) console.log(err)
}

function onSaved (err) {
  if (err) console.log(err)
  const msg = isProd ? 'bundled and minified ' : 'bundled '
  time = Date.now() - time
  console.log(
    chalk.dim('[') +
    chalk.green('css') +
    chalk.dim('] ') +
    chalk.gray(msg) +
    chalk.yellow(localOutput) +
    chalk.dim(' in ') +
    chalk.blue(time) +
    chalk.dim(' ms')
  )
}

module.exports = stylusTask
