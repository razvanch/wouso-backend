const authenticationRouter = require('express').Router()
const HttpStatus = require('http-status-codes')

const User = require('../../models/user')
const requiresLogin = require('../../../utils/routes').requiresLogin

authenticationRouter.get('/', requiresLogin, async (req, res, next) => {
  res.json(req.session.user)
})

authenticationRouter.post('/', async (req, res, next) => {
  const {
    body: { username: reqUsername, password: reqPassword },
    session
  } = req

  if (!reqUsername || !reqPassword) {
    return next({
      message: 'Missing email or password.',
      status: HttpStatus.BAD_REQUEST
    })
  }

  const { id, username, email, firstName, lastName } = await User.authenticate(
    reqUsername,
    reqPassword
  ).catch(({ message, userExists }) => {
    next({
      message,
      status: userExists ? HttpStatus.UNAUTHORIZED : HttpStatus.NOT_FOUND
    })
  })

  session.user = {
    id,
    username,
    email,
    firstName,
    lastName
  }

  res.json(session.user)
})

module.exports = authenticationRouter
