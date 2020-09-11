/* eslint-disable no-useless-escape */
const bcrypt = require('bcrypt')
const imgbbUploader = require('imgbb-uploader')
const path = require('path')
const mv = require('mv')
const router = require('express').Router()
const passport = require('passport')
const lodash = require('lodash')
const querystring = require('querystring')
const _ = require('underscore')
const { User, Company } = require('../models')
const formParser = require('../utils/parsers/form-parser')

const userInfoMiddleware = (req, res, next) => {
  req.body.work = []
  if (req.body['company[]'] && Array.isArray(req.body['company[]'])) {
    for (let i = 0; i < req.body['company[]'].length; i++) {
      req.body.work.push({
        company: req.body['company[]'][i],
        position: req.body['position[]'][i],
        website: req.body['companyWebsite[]'][i],
        startDate: req.body['workStartDate[]'][i],
        endDate: req.body['workEndDate[]'][i] || 'present',
        workSummary: req.body['workSummary[]'][i]
      })
    }
  } else if (req.body['company[]']) {
    req.body.work.push({
      company: req.body['company[]'],
      position: req.body['position[]'],
      website: req.body['companyWebsite[]'],
      startDate: req.body['workStartDate[]'],
      endDate: req.body['workEndDate[]'] || 'present',
      workSummary: req.body['workSummary[]']
    })
  }

  req.body.education = []
  if (req.body['institution[]'] && Array.isArray(req.body['institution[]'])) {
    for (let i = 0; i < req.body['institution[]'].length; i++) {
      req.body.education.push({
        institution: req.body['institution[]'][i],
        area: req.body['area[]'][i],
        studyType: req.body['studyType[]'][i],
        startDate: req.body['studyStartDate[]'][i],
        endDate: req.body['studyEndDate[]'][i],
        gpa: req.body['gpa[]'][i]
      })
    }
  } else if (req.body['institution[]']) {
    req.body.education.push({
      institution: req.body['institution[]'],
      area: req.body['area[]'],
      studyType: req.body['studyType[]'],
      startDate: req.body['studyStartDate[]'],
      endDate: req.body['studyEndDate[]'],
      gpa: req.body['gpa[]']
    })
  }

  req.body.awards = []
  if (req.body['title[]'] && Array.isArray(req.body['title[]'])) {
    for (let i = 0; i < req.body['title[]'].length; i++) {
      req.body.awards.push({
        title: req.body['title[]'][i],
        date: req.body['date[]'][i],
        awarder: req.body['awarder[]'][i],
        summary: req.body['awardSummary[]'][i]
      })
    }
  } else if (req.body['title[]']) {
    req.body.awards.push({
      title: req.body['title[]'],
      date: req.body['date[]'],
      awarder: req.body['awarder[]'],
      summary: req.body['awardSummary[]']
    })
  }

  req.body.skills = []
  if (req.body['skillName[]'] && Array.isArray(req.body['skillName[]'])) {
    for (let i = 0; i < req.body['skillName[]'].length; i++) {
      req.body.skills.push({
        name: req.body['skillName[]'][i],
        level: req.body['level[]'][i],
        keywords: _.map(req.body['keywords[]'][i].split(','), (keyword) => keyword.trim())
      })
    }
  } else if (req.body['skillName[]']) {
    req.body.skills.push({
      name: req.body['skillName[]'],
      level: req.body['level[]'],
      keywords: _.map(req.body['keywords[]'].split(','), (keyword) => keyword.trim())
    })
  }

  req.body.references = []
  if (req.body['referral[]'] && Array.isArray(req.body['referral[]'])) {
    for (let i = 0; i < req.body['referral[]'].length; i++) {
      req.body.references.push({
        name: req.body['referral[]'][i],
        reference: req.body['reference[]'][i]
      })
    }
  } else if (req.body['referral[]']) {
    req.body.references.push({
      name: req.body['referral[]'],
      reference: req.body['reference[]']
    })
  }

  req.body.profiles = []
  if (req.body.twitter) {
    req.body.profiles.push({
      network: 'Twitter',
      url: req.body.twitter
    })
  }

  if (req.body.github) {
    req.body.profiles.push({
      network: 'Github',
      url: req.body.github
    })
  }

  if (req.body.linkedin) {
    req.body.profiles.push({
      network: 'LinkedIn',
      url: req.body.linkedin
    })
  }

  req.body.location = {
    address: req.body.address,
    city: req.body.city,
    countryCode: req.body.countryCode,
    postalCode: req.body.postalCode,
    region: req.body.region
  }

  next()
}

router.get('/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'] }))

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/err' }), (req, res) => {
  if (req.session.passport.user.exists) {
    delete req.session.passport.user.exists
    req.session.user = req.session.passport.user
    res.redirect(
      '/?logged-in=' +
      Math.random()
        .toString()
        .slice(2)
        .slice(0, 5)
    )
  } else {
    const query = querystring.stringify({
      username: req.session.passport.user.username
    })

    res.redirect('/account/new/user/info?' + query)
  }
})

router.get('/new/user/info', (req, res, next) => {
  res.render('auth/forms/user', {
    title: req.app.config.name
  })
})

router.post('/new/user/info', userInfoMiddleware, async (req, res, next) => {
  lodash.set(req.session.passport.user, ['resume.basics.summary'], req.body.summary)
  lodash.set(req.session.passport.user, ['resume.education'], req.body.education)
  lodash.set(req.session.passport.user, ['resume.work'], req.body.work)
  lodash.set(req.session.passport.user, ['resume.awards'], req.body.awards)
  lodash.set(req.session.passport.user, ['resume.skills'], req.body.skills)
  lodash.set(req.session.passport.user, ['resume.references'], req.body.references)
  lodash.set(req.session.passport.user, ['resume.basics.profiles'], req.body.profiles)
  lodash.set(req.session.passport.user, ['resume.basics.location'], req.body.location)
  lodash.set(req.session.passport.user, ['resume.basics.label'], req.body.expertise)
  lodash.set(req.session.passport.user, ['resume.basics.website'], req.body.website)
  lodash.set(req.session.passport.user, ['resume.basics.phone'], req.body.phone)
  const newUser = new User(req.session.passport.user)
  try {
    await newUser.save()
  } catch (error) {
    return res.render('error', {
      error
    })
  }
  req.session.user = newUser
  res.redirect(
    '/?logged-in=' + Math.random()
      .toString()
      .slice(2)
      .slice(0, 5)
  )
})

router.get('/out', (req, res, next) => {
  req.session.destroy(() => {
    res.redirect('/?action=logout')
  })
})

router.get('/new/company/info', (req, res, next) => {
  res.render('auth/forms/company', {
    title: req.app.config.name,
    error: false
  })
})

router.post('/new/company/info', formParser, async (req, res, next) => {
  const username = req.body.name
    .replace(/(~|`|!|@|#|$|%|^|&|\*|\(|\)|{|}|\[|\]|;|:|\"|'|<|,|\.|>|\?|\/|\\|\||-|_|\+|=)/g, '')
    .replace(/\s/g, '-')
    .toLowerCase()

  const existingUser = await Company.findOne({ username }).exec()

  if (existingUser) {
    return res.status(400).render('auth/forms/company', {
      title: req.app.config.name,
      error: 'Account for this company already exists'
    })
  }

  const randomId = Date.now()
  const oldpath = req.files.logo.path

  if (req.body.password !== req.body.password2) {
    return res.status(400).send('auth/forms/company', {
      title: req.app.config.name,
      error: 'Passwords do not match'
    })
  }

  const type = req.files.logo.name.split('.').slice(-1)[0].toLowerCase()
  if (!['png', 'jpg', 'jpeg'].includes(type)) {
    return res.status(400).render('auth/forms/company', {
      title: req.app.config.name,
      error: 'Unsupported file format'
    })
  }

  const newpath = path.join(__dirname, '..', 'public', 'company', `${username}_${randomId}_${req.files.logo.name}`)

  mv(oldpath, newpath, (error) => {
    if (error) {
      console.log(error)
    }
  })

  const { image: { url } } = await imgbbUploader(process.env.IMGBB_API_KEY, path.resolve(newpath))

  const company = new Company({
    name: req.body.name,
    username,
    email: req.body.email,
    logo: url,
    website: req.body.website,
    size: req.body.size,
    description: req.body.description,
    usertype: 'company',
    location: {
      address: req.body.address,
      area: req.body.region,
      city: req.body.city,
      countryCode: req.body.countryCode,
      postalCode: req.body.postalCode
    },
    password: bcrypt.hashSync(req.body.password, 10)
  })

  try {
    await company.save()
  } catch (error) {
    return res.status(500).send('auth/forms/company', {
      title: req.app.config.name,
      error: (error.name === 'MongoError' && error.code === 11000) ? 'Account for this company already exists' : error
    })
  }

  req.session.user = company
  res.redirect(
    '/?logged-in=' + Math.random()
      .toString()
      .slice(2)
      .slice(0, 5)
  )
})

router.get('/company/login', async (req, res, next) => {
  res.render('auth/forms/login', {
    title: req.app.config.name,
    error: false
  })
})

router.post('/company/login', async (req, res, next) => {
  let user
  try {
    user = await Company.findOne({ username: req.body.username }).exec()
  } catch (error) {
    return res.status(500).render('auth/forms/login', {
      title: req.app.config.name,
      error: 'Internal server error'
    })
  }

  if (!user) {
    return res.status(400).render('auth/forms/login', {
      title: req.app.config.name,
      error: 'No company with that username found'
    })
  } else {
    if (bcrypt.compareSync(req.body.password, user.password)) {
      await (await user.populate('posts').populate('notifications')).execPopulate()
      req.session.user = user
      return res.redirect(
        '/?logged-in=' + Math.random()
          .toString()
          .slice(2)
          .slice(0, 5)
      )
    } else {
      return res.status(400).render('auth/forms/login', {
        error: 'Incorrect username/password'
      })
    }
  }
})

module.exports = router
