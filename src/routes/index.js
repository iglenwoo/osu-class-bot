const router = require('express').Router()
const searchClass = require('./class')
const searchProfessor = require('./professor')
const auth = require('./auth')
const redirect = require('./auth/redirect')

router.post('/class', searchClass)
router.post('/prof', searchProfessor)
router.get('/auth', auth)
router.get('/auth/redirect', redirect)

module.exports = router