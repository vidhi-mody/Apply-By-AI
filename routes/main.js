const chalk = require('chalk')
const router = require('express').Router()
const { Company, User } = require('../models')

router.get('/', (req, res, next) => {
  if (req.session.user) {
    if (req.session.user.usertype === 'user') {
      User.findOne({ username: req.session.user.username })
        .exec((error, currentUser) => {
          if (error) {
            return res.render('error', { error: error })
          }
          res.render('index', {
            user: currentUser,
            title: req.app.config.title,
            events: req.app.events
          })
        })
    } else {
      Company.findOne({ username: req.session.user.username })
        .exec((error, currentUser) => {
          if (error) {
            console.log(chalk.red(error))
            return res.render('error', { error: error })
          }
          res.render('index', {
            user: currentUser,
            title: req.app.config.title,
            events: req.app.events
          })
        })
    }
  } else {
    res.render('land', {
      title: req.app.config.name,
      error: req.query.error || false
    })
  }
})

module.exports = router
