const formidable = require('formidable')

module.exports = (req, res, next) => {
  const form = formidable.IncomingForm()
  form.parse(req, (error, fields, files) => {
    if (error) {
      console.log(error)
    }
    req.body = fields
    req.files = files
    next()
  })
}
