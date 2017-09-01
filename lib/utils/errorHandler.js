const stripAnsi = require('strip-ansi')
const ansiHTML = require('ansi-html')

ansiHTML.setColors({
  reset: ['d6d6d6', '2d2d2d'], // FOREGROUND-COLOR or [FOREGROUND-COLOR] or [, BACKGROUND-COLOR] or [FOREGROUND-COLOR, BACKGROUND-COLOR]
  black: '545454',	// String
  red: 'f58e8e',
  green: 'a9d3ab',
  yellow: 'fed37f',
  blue: '7aabd4',
  magenta: 'd6add5',
  cyan: '79d4d5',
  lightgrey: '797979',
  darkgrey: '696969'
});

function getFilePath (str) {
  var hasRoot = /^[a-z]:/i.exec(str)
  var colonLeftIndex = 0
  if (hasRoot) {
    colonLeftIndex = hasRoot[0].length
  }
  var pathEnd = str.split('\n')[0].indexOf(':', colonLeftIndex)
  if (pathEnd === -1) {
    // invalid string, return non-formattable result
    return null
  }
  return str.substring(0, pathEnd)
}

module.exports = function errorHandler(error) {
  error = ansiHTML(error)
  const errors = error.split('\n\n<span')
  const mainText = errors[0]

  const path = getFilePath(mainText)
  const decoratedPath = '<span class="path" style="font-weight: bold; color: red;">' + path + '</span>'
  console.log()

  const newMainText = '<div class="main">' + mainText.replace(new RegExp(path, 'g'), decoratedPath) + '</div>'
  const final = error.replace(mainText, newMainText)
  
  const html = `
    <style>
      body {
        padding: 30px;
        color: #f58e8e;
      }
      pre {
        white-space: pre-wrap;
      }
    </style>
    <pre>${final}</pre>
  `

  // console.log(html)
  // console.log('highlight', highlight)
  return `
    ;[].slice.call(document.querySelectorAll('link[rel=stylesheet]')).forEach(function(stylesheet) { stylesheet.parentNode.removeChild(stylesheet) })
    document.body.innerHTML = \`${html}\`
    setTimeout(() => {
      const span = document.querySelector('span:not(.path)')
      span.style.display = 'block'

      const pre = document.querySelector('pre')

      const children = [].slice.call(document.querySelector('pre').children)
      children.forEach(child => {
        child._display = child.style.display
        child.style.display = 'none'
      })
      console.log(pre.innerText)
      children.forEach(child => {
        if (child._display) child.style.display = child._display
        else child.style.display = 'initial'
      })
    })
  `
}