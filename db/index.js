const Sequelize = require('sequelize')

const config = require('../config')
const logger = require('../logger')

const db = new Sequelize(
  config.database.name,
  config.database.username,
  config.database.password,
  {
    host: config.database.host || 'localhost',
    dialect: config.database.dialect || 'mysql',
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    operatorsAliases: false,
    logging: config.database.logging ? message => logger.debug(message) : false,
    define: {
      engine: 'INNODB'
    }
  }
)

db
  .authenticate()
  .then(() => {
    logger.info('Database connection has been established successfully.')

    return db.sync()
  })
  .then(() => {
    logger.info('Database synchronized successfully.')
  })
  .catch(err => {
    logger.error(`Unable to connect to the database: ${err.message}`)
  })

module.exports = db
