const router = require('express').Router()
const searchClass = require('./class')
const searchProfessor = require('./professor')

router.post('/class', searchClass)
router.post('/prof', searchProfessor)

module.exports = router