const router = require('express').Router()
const { Room, Company, User } = require('../models')
const _ = require('underscore')

const findRoom = async (receiver, sender) => {
  return (_.find(receiver.chats, chat => {
    if (chat.users[0]._id.equals(receiver._id) &&
      chat.users[0].usertype === receiver.usertype &&
      chat.users[1]._id.equals(sender._id) &&
      chat.users[1].usertype === sender.usertype) {
      return true
    } else if (chat.users[1]._id.equals(receiver._id) &&
      chat.users[1].usertype === receiver.usertype &&
      chat.users[0]._id.equals(sender._id) &&
      chat.users[0].usertype === sender.usertype) {
      return true
    } else {
      return false
    }
  }))
}

router.get('/:usertype/:id', async (req, res, next) => {
  const { usertype, id } = req.params

  // Check if user is trying to chat with self
  if (req.session.user.usertype === usertype && req.session.user._id.toString() === id) {
    return res.status(400).render('error', {
      error: new Error('Cannot chat with yourself')
    })
  } else {
    require('../utils/socket.io/socket')

    // Fetch the receiver
    let receiver
    try {
      if (usertype === 'user') {
        receiver = await (await User.findById(id).populate('chats')).execPopulate()
      } else {
        receiver = await (await Company.findById(id).populate('chats')).execPopulate()
      }
    } catch (error) {
      return res.status(500).render('error', {
        error: new Error('Database error')
      })
    }

    // User cannot chat with someone who doesn't have an account
    if (!receiver) {
      return res.status(404).render('error', {
        error: new Error('No user found')
      })
    }

    req.session.socket = {}

    // Check if room has already been created for this pair
    let room = await findRoom(receiver, req.session.user)

    // If room already exists
    if (room) {
      try {
        room = await (await Room.findById(room._id).populate({
          path: 'messages',
          populate: {
            path: 'by'
          }
        })).execPopulate()
      } catch (error) {
        return res.status(500).render('error', {
          error: new Error('Error fetching chats')
        })
      }

      req.session.socket.room = room._id
      res.render('chat/room', {
        title: req.app.config.name,
        room,
        session: req.session.user,
        receiver
      })
    } else {
      const newRoom = new Room({
        users: [receiver, req.session.user]
      })

      let sender

      // Save the new room
      try {
        await newRoom.save()
      } catch (error) {
        return res.status(500).render('error', {
          error: new Error('Error saving chat room')
        })
      }

      req.session.socket.room = newRoom._id

      // Save the receiver chats
      receiver.chats.push(newRoom._id)
      try {
        await receiver.save()
      } catch (error) {
        return res.status(500).render('error', {
          error: new Error('Error saving receiver')
        })
      }

      // Save sender
      try {
        if (req.session.user.usertype === 'user') {
          sender = await User.findById(req.session.user._id).exec()
        } else {
          sender = await Company.findById(req.session.user._id).exec()
        }
        sender.chats.push(newRoom._id)
        sender = await sender.save()
      } catch (error) {
        return res.status(500).render('error', {
          error: new Error('Error saving sender')
        })
      }

      res.render('chat/room', {
        title: req.app.config.name,
        room: newRoom,
        session: sender,
        receiver
      })
    }
  }
})

module.exports = router
