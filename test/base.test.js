'use strict'

const test = require('tape')
const { once } = require('events')
const { join } = require('path')
const { tmpdir } = require('os')
const { unlinkSync } = require('fs')
const { readFile } = require('fs')
const ThreadStream = require('..')

const files = []
let count = 0

function file () {
  const file = join(tmpdir(), `thread-stream-${process.pid}-${process.hrtime().toString()}-${count++}`)
  files.push(file)
  return file
}

process.on('beforeExit', () => {
  for (const file of files) {
    try {
      unlinkSync(file)
    } catch (e) {
      console.log(e)
    }
  }
})

test('base', function (t) {
  t.plan(6)

  const dest = file()
  const stream = new ThreadStream({
    filename: join(__dirname, 'to-file'),
    workerData: { dest }
  })

  stream.on('ready', () => {
    t.pass('ready emitted')
  })

  t.ok(stream.write('hello world\n'))
  t.ok(stream.write('something else\n'))

  stream.end()

  stream.on('finish', () => {
    readFile(dest, 'utf8', (err, data) => {
      t.error(err)
      t.equal(data, 'hello world\nsomething else\n')
    })
  })

  stream.on('close', () => {
    t.pass('close emitted')
  })
})
