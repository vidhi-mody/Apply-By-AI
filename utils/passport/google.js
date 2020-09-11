const chalk = require('chalk')
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth2').Strategy
const { User } = require('../../models')

passport.serializeUser((user, done) => {
  done(null, user)
})

passport.deserializeUser((user, done) => {
  // save whole user as session
  done(null, user)
})

passport.deserializeUser((id, done) => {
  done(null, {})
})

passport.use(
  new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    let dbUser
    try {
      dbUser = await User.findOne({ 'resume.basics.email': profile.email }).exec()
    } catch (error) {
      console.log(chalk.red('Error: ', error))
    }
    if (dbUser) {
      dbUser.exists = true
      return done(null, dbUser)
    } else {
      console.log(chalk.blue('New user'))
      dbUser = {
        resume: {
          basics: {
            name: profile.displayName,
            picture: profile.photos[0].value,
            email: profile.email
          }
        },
        username: profile.email.substr(0, profile.email.lastIndexOf('@'))
      }
      return done(null, dbUser)
    }
  }
  )
)
