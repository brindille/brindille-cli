const ansiHTML = require('ansi-html')

ansiHTML.setColors({
  reset: ['d6d6d6', '2d2d2d'], // FOREGROUND-COLOR or [FOREGROUND-COLOR] or [, BACKGROUND-COLOR] or [FOREGROUND-COLOR, BACKGROUND-COLOR]
  black: '545454', // String
  red: 'f58e8e',
  green: 'a9d3ab',
  yellow: 'fed37f',
  blue: '7aabd4',
  magenta: 'd6add5',
  cyan: '79d4d5',
  lightgrey: '797979',
  darkgrey: '696969'
})

function getFilePath (str) {
  const search = str.match(/\/[A-Za-z0-9/\-_]+\.js|'\/[A-Za-z0-9/\-_]+'/g)
  return search && search.length ? search[0] : null
}

function onDocumentReady () {
  const span = document.querySelector('span:not(.path)')
  if (span) span.style.display = 'block'
}

function createOutput (html) {
  return `
    ;[].slice.call(document.querySelectorAll('link[rel=stylesheet]')).forEach(function(stylesheet) { stylesheet.parentNode.removeChild(stylesheet) })
    document.body.innerHTML = \`${html}\`
    setTimeout(${String(onDocumentReady)})
  `
}

function createOutputHTML (content) {
  return `
    <style>
      body {
        padding: 30px;
        color: #f58e8e;
      }
      pre {
        white-space: pre-wrap;
      }
    </style>
    <pre>${content}</pre>
  `
}

function highlightPaths (html) {
  const path = getFilePath(html)
  const decoratedPath = '<span class="path" style="font-weight: bold; color: red;">' + path + '</span>'
  return html.replace(new RegExp(path, 'g'), decoratedPath)
}

function lintError (errors) {
  const error = errors.map(err => highlightPaths(err)).join('\n\n')
  let html = ansiHTML(error)
  html = '<h1 style="color:red;">Lint errors</h1><br>' + html
  html = createOutputHTML(html)
  html = highlightPaths(html)
  return createOutput(html)
}

function compilationError (error) {
  let html = ansiHTML(error)
  html = '<h1 style="color:red;">Compilation errors</h1><br>' + html
  html = createOutputHTML(html)
  html = highlightPaths(html)
  return createOutput(html)
}

module.exports = {
  lintError,
  compilationError
}
