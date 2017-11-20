const standard = require('standard')
const fs = require('fs')
const chalk = require('chalk')
const errorHandler = require('./utils/errorHandler')

const logPrefix = chalk.dim('[') + chalk.red('js') + chalk.dim(']  ')

function all (logger, output, callback) {
  some(logger, output, process.cwd() + '/**/*.js', [], callback)
}

function removeChangedFilesFromSavedErrors (changedFiles, savedErrors) {
  return savedErrors.filter(error => {
    let keep = true
    changedFiles.forEach(filename => {
      if (error.indexOf(filename) >= 0) {
        keep = false
      }
    })
    return keep
  })
}

function removeIgnoredFilesFromGlob(globArray) {
  const suffix = '.js'
  return globArray.filter(file => {
    return file.indexOf(suffix, file.length - suffix.length) !== -1
  })
}

function some (logger, output, glob, savedErrors, callback) {
  if (Array.isArray(glob)) {
    glob = removeIgnoredFilesFromGlob(glob)
    savedErrors = removeChangedFilesFromSavedErrors(glob, savedErrors)
  }
  standard.lintFiles(glob, {}, (error, results) => {
    if (error) {
      logger.error(logPrefix + chalk.red('Something went wrong while linting'))
      return
    }
    const extracted = extractErrors2(results)
    const errors = mergeArraysNoDupes(savedErrors, extracted)
    if (errors.length) {
      logger.error(logPrefix + chalk.red('Lint errors') + chalk.dim(' view on browser'))
      const writeStream = fs.createWriteStream(output)
      writeStream.write(errorHandler.lintError(errors))
      writeStream.end()
    }
    callback(errors)
  })
}

function mergeArraysNoDupes (a, b) {
  return a.concat(b.filter(item => a.indexOf(item) < 0))
}

function extractErrors2 (results) {
  const errors = []
  results.results
    .filter(result => result.errorCount > 0 || result.warningCount > 0)
    .forEach(error => {
      const file = error.filePath
      error.messages.forEach(msg => {
        errors.push(file + ': (' + msg.line + ':' + msg.column + ') ' + msg.message)
      })
    })
  return errors
}

module.exports = {
  all,
  some
}
