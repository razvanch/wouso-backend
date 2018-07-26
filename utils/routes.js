const HttpStatus = require('http-status-codes')

/**
 * Wraps @handler in a try-catch statement and returns a new @RequestHandler.
 *
 * @param {RequestHandler} handler
 * @return {RequestHandler}
 */
module.exports.catchAll = handler => async (req, res, next) => {
  try {
    await handler(req, res, next)
  } catch (ex) {
    next(ex)
  }
}

module.exports.requiresLogin = (req, res, next) => {
  const { session } = req

  if (!session || !session.user) {
    return next({
      message: 'You must be logged in to view this page.',
      status: HttpStatus.UNAUTHORIZED
    })
  }

  next()
}
