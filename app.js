const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const express = require('express')
const createError = require('http-errors')
const logger = require('morgan')
const path = require('path')
const passport = require('passport')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const { Company, User } = require('./models')

const {
  AccountRouter,
  ApiRouter,
  BotRouter,
  ChatRouter,
  PostRouter,
  NotificationRouter,
  IndexRouter,
  UserRouter
} = require('./routes')

const app = express()

require('dotenv').config()

app.config = require('./config/app')

// View engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

require('./utils/passport/google')

const cooky = {
  secret: 'work hard',
  resave: true,
  expires: new Date() * 60 * 60 * 24 * 7,
  saveUninitialized: true,
  store: new MongoStore({ url: app.config.db.connectionUri })
}

app.sessionMiddleware = session(cooky)
if (process.env.NODE_ENV === 'production') {
  // Production middlewares
  console.log('Production mode on')
  const compression = require('compression')
  const minify = require('express-minify')
  app.use(compression())
  app.use(
    minify({
      cache: path.join(__dirname, 'public', 'cache'),
      uglifyJS: true
    })
  )
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=86400')
    next()
  })
}

app.set('trust proxy', 1) // trust first proxy
app.use(app.sessionMiddleware)
app.use(logger('tiny'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(passport.initialize())
const date = new Date()
app.events = [
  {
    title: 'Apply-by-AI',
    text: 'Think Recruitment? Think Apply-by-AI !',
    img: '/images/4-large.png',
    time: [date, date.setDate(date.getDate() + 1)],
    link: {
      link_url: 'https://github.com/und3fined-v01d/apply-by-ai',
      link_text: 'Visit'
    }
  }
]
app.use(
  express.static(
    path.join(__dirname, 'public'),
    process.env.NODE_ENV === 'production'
      ? {
        maxAge: 31557600
      }
      : {}
  )
)

app.use((req, res, next) => {
  res.locals.user = req.session.user ? req.session.user : false
  res.locals.where = req.url
  next()
})

app.use(passport.initialize())
app.use(passport.session())

app.use(async (req, res, next) => {
  if (!req.query.delete_notif || !req.session.user) {
    return next()
  }
  next = () => {
    console.log(req.originalUrl)
    return res.redirect(
      req.originalUrl.split('delete_notif=' + req.query.delete_notif).join('')
    )
  }
  let user
  try {
    if (req.session.user.usertype === 'user') {
      user = await (await User.findById(req.session.user._id).populate('notifications')).execPopulate()
    } else {
      user = await (await Company.findById(req.session.user._id).populate('notifications')).execPopulate()
    }
  } catch (error) {
    console.log(error)
    return next()
  }
  if (!user) {
    return next()
  }
  const notif = user.notifications.find(x => x.id === req.query.delete_notif)
  if (!notif) {
    return next()
  }
  user.notifications.splice(user.notifications.indexOf(notif), 1)
  await user.save()
  return next()
})

app.use('/', IndexRouter)
app.use('/account/', AccountRouter)
app.use(async (req, res, next) => {
  if (req.session.user) {
    let user
    try {
      if (req.session.user.usertype === 'user') {
        user = await User.findOne({ username: req.session.user.username }).exec()
      } else {
        user = await Company.findOne({ email: req.session.user.email }).exec()
      }
    } catch (error) {
      next(new Error('Could not restore User from Session.'))
    }
    if (user) {
      req.session.user = user
      return next()
    } else {
      return next(new Error('Could not restore User from Session.'))
    }
  } else {
    res.redirect('/')
  }
})
app.use('/users/', UserRouter)
app.use('/notifications/', NotificationRouter)
app.use('/post/', PostRouter)
app.use('/chat', ChatRouter)
app.use('/api/', ApiRouter)
app.use('/bot/', BotRouter)

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404))
})

// 404 error handler
app.use((error, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = error.message
  res.locals.error = req.app.get('env') === 'development' ? error : {}

  // render 404 page
  res.status(error.status || 500)
  res.render('error')
})

if (process.env.GENERATE_DATA) {
  require('./startup')
}

module.exports = app
