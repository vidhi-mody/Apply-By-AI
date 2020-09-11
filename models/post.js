const { db: { connectionUri } } = require('../config/app')
const mongoose = require('mongoose')

mongoose.connect(connectionUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const commentSchema = mongoose.Schema({
  by: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'onModel'
  },
  text: {
    type: String,
    required: [true, 'Comment must have a body']
  },
  onPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  onModel: {
    type: String,
    enum: ['Company', 'User']
  }
})

const likeSchema = mongoose.Schema({
  by: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'onModel'
  },
  onModel: {
    type: String,
    enum: ['User', 'Company']
  },
  onPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }
})

const postSchema = mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'onModel'
  },
  staticUrl: String,
  caption: String,
  category: {
    type: String,
    enum: ['promotion', 'moment', 'engagement', 'thought', 'news/trending', 'meme/fact']
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Like'
  }],
  type: String,
  createdAt: String,
  onModel: {
    type: String,
    enum: ['User', 'Company']
  }
})

const Comment = mongoose.model('Comment', commentSchema)
const Like = mongoose.model('Like', likeSchema)
const Post = mongoose.model('Post', postSchema)

module.exports = {
  Comment,
  Like,
  Post
}
