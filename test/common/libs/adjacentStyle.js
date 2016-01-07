const test = require('ava')
const setup = require('../../helpers/setupDom')

const adjacentStyle = require('../../../src/common/libs/adjacentStyle')

test.before(() => setup())

test(t => {
  const div = document.createElement('div')
  document.body.appendChild(div)

  const style = adjacentStyle(div)
  t.ok(style.left !== undefined)
  t.ok(style.top !== undefined)
})
