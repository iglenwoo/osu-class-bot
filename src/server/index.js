const express = require('express')
const bodyParser = require('body-parser')
const router = require('../routes')

const app = express()

app.use(bodyParser.json())
// NOTE: 'parsing application/x-www-form-urlencoded' is necessary.
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/', router)

module.exports = app