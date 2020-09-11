const { db: { connectionUri } } = require('../config/app')
const mongoose = require('mongoose')

mongoose.connect(connectionUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const messageSchema = mongoose.Schema({
  txt: String,
  by: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'onModel'
  },
  time: String,
  onModel: {
    type: String,
    enum: ['Company', 'User']
  }
})

const roomSchema = mongoose.Schema({
  users: Array,
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }]
})

module.exports = {
  Message: mongoose.model('Message', messageSchema),
  Room: mongoose.model('Room', roomSchema)
}
