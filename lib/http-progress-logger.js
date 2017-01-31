#! /usr/local/bin/node
'use strict'

class ProgressLogger {
  constructor () {
    this.longestLineLength = 0
    this.linesWrote = 0
    this.finished = false
  }

  log (data) {
    let line = `\r${(data.current / data.total * 100).toFixed(2)}% [${data.current} of ${data.total}] <${data.name}>`

    if (line.length > this.longestLineLength) {
      this.longestLineLength = line.length
      process.stdout.write(line)
    } else {
      for (let i = 0, len = this.longestLineLength - line.length; i < len; i++) {
        line += ' '
      }
      process.stdout.write(line)
    }

    if (data.current >= data.total) {
      this.finished = true
      process.stdout.write('\n')
    }

    this.linesWrote++
  }

  reset () {
    this.longestLine = 0
    this.linesWrote = 0
    this.finished = false
  }
}

module.exports = ProgressLogger
