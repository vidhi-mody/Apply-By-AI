const { red } = require('chalk')
const { sessionMiddleware } = require('../../app')
const sio = require('../../bin/www')
const { Company, Message, Notification, Room, User } = require('../../models')

const logError = (error) => {
  console.log(red(error))
}

sio.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res, next)
})

const type = async (socket) => {
  let user
  try {
    if (socket.session.user.usertype === 'user') {
      user = await User.findById(socket.session.user._id).exec()
    } else {
      user = await Company.findById(socket.session.user._id).exec()
    }
  } catch (error) {
    logError(error)
  }

  socket.to(socket.session.socket.room).emit('typing', {
    username: user.username
  })
}

const sendMsg = async (socket, chat) => {
  const time = new Date()
  let room = socket.room

  const message = new Message({
    txt: chat.txt,
    by: socket.session.user._id,
    time,
    onModel: socket.session.user.usertype === 'user' ? 'User' : 'Company'
  })

  await message.save()

  room.messages.push(message._id)
  await room.save()

  room = await (await room.populate({
    path: 'message',
    populate: {
      path: 'by'
    }
  })).execPopulate()

  logError(room.messages)

  sio.to(socket.session.socket.room).emit('new msg', {
    txt: chat.txt,
    by: socket.session.user,
    time
  })

  let receiver = room.users.find(user => user.usertype !== socket.session.user.usertype && user._id !== socket.session.user._id)
  try {
    if (receiver.usertype === 'user') {
      receiver = await User.findById(receiver._id).exec()
    } else {
      receiver = await Company.findById(receiver._id).exec()
    }
  } catch (error) {
    logError(error)
  }

  const notification = new Notification({
    msg: `@${socket.session.user.username} sent you a message: ${chat.txt.substring(0, 15)}`,
    time: new Date(),
    for: receiver._id,
    link: `/chat/${socket.session.user.usertype}/${socket.session.user._id}`,
    onModel: receiver.usertype === 'user' ? 'User' : 'Company'
  })

  await notification.save()
  receiver.notifications.push(notification._id)

  await receiver.save()
}

sio.on('connection', async (socket) => {
  const session = socket.request.session
  socket.session = session
  socket.join(session.socket.room)
  const room = await (await Room.findById(session.socket.room).populate({
    path: 'messages',
    populate: {
      path: 'by'
    }
  })).execPopulate()

  if (!room) {
    return socket.disconnect('unauthorized')
  } else {
    socket.room = room
  }

  socket.on('msg', (data) => {
    sendMsg(socket, data)
  })
  socket.on('typing', (data) => {
    type(socket)
  })
})

module.exports = sio
