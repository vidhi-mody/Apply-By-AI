const router = require('express').Router()
const ta = require('time-ago')
const marked = require('marked')
const _ = require('underscore')

const { Application, Company, Job, User } = require('../models')

router.get('/', async (req, res, next) => {
  let users, companies
  try {
    users = await User.find({}).exec()
  } catch (error) {
    res.status(500).render('error', {
      error: new Error('An error was encountered while fetching all users.')
    })
  }
  try {
    companies = await Company.find({}).exec()
  } catch (error) {
    res.status(500).render('error', {
      error: new Error('An error was encountered while fetching all companies')
    })
  }
  res.render('user/list', {
    title: req.app.config.name,
    users,
    companies
  })
})

router.get('/user/@:username', async (req, res, next) => {
  let user
  let applications = []
  try {
    user = await (await User.findOne({ username: req.params.username }).populate('followers').populate('posts')).execPopulate()
  } catch (error) {
    return res.status(500).send({ message: 'Database error!' })
  }

  user.posts.forEach(post => {
    post.timeago = ta.ago(post.createdAt)
  })

  if (!user) {
    return res.status(404).render('error', {
      error: new Error('No user found with that username.')
    })
  }

  if (user.usertype === req.session.user.usertype && user.username === req.session.user.username) {
    applications = await Application.find({ by: user._id }).populate({
      path: 'for',
      populate: {
        path: 'company'
      },
      options: {
        lean: true
      }
    }).exec()
    applications = _.each(applications, application => {
      application.for.description = marked(application.for.description)
    })
    applications = applications.reverse()
  }

  res.render('user/user-profile', {
    title: req.app.config.title,
    user: req.session.user,
    applications,
    searchUser: user
  })
})

router.get('/user/@:username/resume', async (req, res, next) => {
  let user
  try {
    user = await User.findOne({ username: req.params.username }).exec()
  } catch (error) {
    return res.status(404).render('error', {
      error: new Error('No user found with that username!')
    })
  }

  res.render('user/resume', {
    title: `Resume | ${user.username}`,
    user
  })
})

router.get('/company/@:username', async (req, res, next) => {
  let company
  try {
    company = await (await Company.findOne({ username: req.params.username }).populate('followers').populate('jobListings').populate({ path: 'posts', options: { lean: true } })).execPopulate()
  } catch (error) {
    console.log(error)
    return res.status(500).send({ message: 'Database error!' })
  }

  if (!company) {
    return res.status(404).render('error', {
      error: new Error('No user found with that username.')
    })
  }

  let jobs = await Job.find({ company: company._id }).populate({
    path: 'applications',
    populate: {
      path: 'by'
    }
  }).exec()

  jobs = _.each(jobs, job => {
    job.description = marked(job.description)
  })

  res.render('user/company-profile', {
    title: req.app.config.title,
    company,
    user: req.session.user,
    jobs
  })
})

module.exports = router
