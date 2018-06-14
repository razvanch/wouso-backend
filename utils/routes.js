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
