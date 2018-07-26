const usersRouter = require('express').Router()

const authenticationRouter = require('../authentication/routes')

usersRouter.use('/authentication', authenticationRouter)

module.exports = usersRouter
