const bcrypt = require('bcrypt')

const db = require('../../db')

const User = db.define(
  'users',
  {
    username: {
      type: db.Sequelize.STRING,
      unique: {
        msg: 'This email is already registered.'
      },
      allowNull: false,
      set (val) {
        this.setDataValue('username', val.toLowerCase().trim())
      }
    },
    password: {
      type: db.Sequelize.STRING,
      allowNull: false
    },
    email: {
      type: db.Sequelize.STRING,
      set (val) {
        this.setDataValue('email', val.toLowerCase().trim())
      }
    },
    firstName: {
      type: db.Sequelize.STRING
    },
    lastName: {
      type: db.Sequelize.STRING,
      defaultValue: 0
    }
  },
  { timestamps: false }
)

const hashPassword = (user, options) =>
  new Promise((resolve, reject) => {
    if (options.fields.indexOf('password') < 0) return resolve()

    bcrypt.hash(user.getDataValue('password'), 10, function (err, hashed) {
      if (err) return reject(err)

      user.setDataValue('password', hashed)

      resolve()
    })
  })

User.beforeUpdate(hashPassword)
User.beforeCreate(hashPassword)

delete User.bulkCreate

User.authenticate = (username, password) =>
  new Promise((resolve, reject) =>
    User.findOne({
      where: { username }
    })
      .then(user => {
        if (!user) {
          return reject({
            message: 'There is no user with the given username.',
            userExists: false
          })
        }

        bcrypt.compare(
          password,
          user.getDataValue('password'),
          (err, result) =>
            (result
              ? resolve(user)
              : reject({
                message: 'The password is incorrect.',
                userExists: true
              }))
        )
      })
      .catch(reject)
  )

module.exports = User
