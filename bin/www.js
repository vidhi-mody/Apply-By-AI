#!/usr/bin/env node

/**
 * Module dependencies.
*/
const app = require('../app')
const debug = require('debug')('v2.0.0:server')
const http = require('http')
const io = require('socket.io')
const mongoAdapter = require('socket.io-adapter-mongo')

http.globalAgent.maxSockets = Infinity

const normalizePort = (val) => {
  const port = parseInt(val, 10)

  if (isNaN(port)) {
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}

const port = normalizePort(app.config.http.port)
app.set('port', normalizePort(port))

/**
* Create HTTP server.
*/
const server = http.createServer(app)
const sio = io(server)
sio.adapter(mongoAdapter(app.config.db.connectionUri))

/**
 * Listen on provided port, on all network interfaces.
 */

if (process.env.NODE_ENV === 'production') {
  const appEnv = require('cfenv').getAppEnv()
  server.listen(appEnv.port, appEnv.bind, () => {
    console.log('Server started on ' + appEnv.url)
  })
} else {
  server.listen(port)
}

/**
* Event listener for HTTP server "error" event.
*/
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error
  }

  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port

  // handle specific listen errors with friendly messages
  if (error.code === 'EACCES') {
    console.error(bind + ' requires elevated privileges')
    process.exit(1)
  } else if (error.code === 'EADDRINUSE') {
    console.error(bind + ' is already in use')
    process.exit(1)
  } else {
    throw error
  }
})
server.on('listening', () => {
  const addr = server.address()
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port
  debug('Listening on ' + bind)
  console.log(
    `\n${app.config.name} is listening on http://${app.config.http.host}:${addr.port}\n`
  )
})

module.exports = sio
