const winston = require('winston')
const {
  combine,
  timestamp,
  label,
  prettyPrint,
  colorize,
  simple
} = winston.format

const config = require('../config')

module.exports = winston.createLogger({
  level: config.winston.level || 'silly',
  transports: [new winston.transports.Console()],
  format: combine(colorize(), prettyPrint(), simple())
})
