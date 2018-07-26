const express = require('express')
const cors = require('cors')

const config = require('./config')
const logger = require('./logger')
const db = require('./db')
const session = require('./session')
const appsRouter = require('./apps/routes')

const app = express()

app.use(cors(config.cors))

app.use(express.json())

app.use((req, res, next) => {
  const { json } = res

  res._json = res.json

  res.json = data => res._json({ data })
  res.message = message => res.json({ message })

  next()
})

app.use(session)

app.use('/apps', appsRouter)

app.get('/', (req, res, next) => {
  res.message('Server is up and running.')
})

app.use((err, req, res, next) => {
  if (err) {
    console.log(err)

    logger.error(err)

    res.status(400).message(err.message)
  }
})

app.listen(config.express.port, config.express.host, () =>
  logger.info(
    `Server listening on ${config.express.host}:${config.express.port}.`
  )
)
