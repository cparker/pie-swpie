'use strict'

const express = require('express')
const port = process.env.PORT || 5000
const app = express()
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const server = require('http').createServer(app)
const io = require('socket.io')(server)

app.use(cookieParser())
app.use(express.static('.'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

server.listen(port, '0.0.0.0', () => {
    console.log(`listening on ${port}`)
})
