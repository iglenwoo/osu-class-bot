const router = require('express').Router()
const searchClass = require('./class')

router.post('/class', searchClass)

module.exports = router