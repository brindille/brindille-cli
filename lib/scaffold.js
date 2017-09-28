const path = require('path')
const chalk = require('chalk')
const kebab = require('lodash.kebabcase')
const capitalize = require('lodash.capitalize')
const Metalsmith = require('metalsmith')
const inPlace = require('metalsmith-in-place')
const rename = require('metalsmith-rename')
const pluralize = require('pluralize')

function scaffold (options, logger) {
  const name = options.name
  const kebabName = kebab(name)
  const localDir = '/src/views/' + options.type + '/' + kebabName
  const dir = process.cwd() + localDir

  console.log('name', name)
  console.log('kebabName', kebabName)
  console.log('localDir', localDir)
  console.log('dir', dir)

  Metalsmith(__dirname)
    .metadata({
      ComponentName: name,
      section: options.type === 'sections',
      interactive: options.interactive
    })
    .source(path.join(__dirname, '../lib/templates/component'))
    .destination(dir)
    .use(inPlace())
    .use(rename([
      [/component.js$/, name + '.js'],
      [/component/, kebabName]
    ]))
    .build(function (err) {
      if (err) throw err
    })

  logger.info(
    '\n' + chalk.dim(capitalize(pluralize.singular(options.type))),
    chalk.red(name),
    chalk.dim('was loulou created in'),
    chalk.red(localDir)
  )
}

module.exports = scaffold
