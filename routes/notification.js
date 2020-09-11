const router = require('express').Router()
const { Company, User } = require('../models')

router.get('/', async (req, res, next) => {
  let user
  try {
    if (req.session.user.usertype === 'user') {
      user = await (await User.findById(req.session.user._id).populate('notifications')).execPopulate()
    } else {
      user = await (await Company.findById(req.session.user._id).populate('notifications')).execPopulate()
    }
  } catch (error) {
    return res.status(500).render('error', {
      error: new Error('Error fetching notifications')
    })
  }

  res.render('user/notifications', {
    title: req.app.config.title,
    user
  })
})

module.exports = router
