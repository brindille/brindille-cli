const winston = require('winston')
const util = require('util')
const chalk = require('chalk')
const version = require('../../package.json').version

const CaporalTransport = function (options) {
  this.name = 'caporal'
  this.level = options.level || 'info'
}

util.inherits(CaporalTransport, winston.Transport)

CaporalTransport.prototype.log = function (level, msg, meta, callback) {
  msg = msg + '\n'
  // const levelInt = this.levels[level]  // => this._eventsCount ?
  const levelInt = this._eventsCount
  const stdio = levelInt <= 1 ? 'stderr' : 'stdout'
  process[stdio].write(msg)
  callback(null, true, stdio)
}

exports.createLogger = function createLogger (opts) {
  opts = opts || {}

  const logger = exports.logger = (winston.createLogger)({
    transports: [
      new (CaporalTransport)(opts)
    ]
  })
  return logger
}

exports.printHeader = function (logger) {
  logger.info('\n' + chalk.blue('⊧Brindille') + ' ' + chalk.gray(version))
}
