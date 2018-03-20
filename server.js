'use strict'

const express = require('express')
const port = process.env.PORT || 5000
const app = express()
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const server = require('http').createServer(app)
const mongodb = require('mongodb')
const dbName = 'pie-swipe'
const defaultDBConnection = `mongodb://localhost/${dbName}`
const dbURI = process.env.MONGODB_URI || defaultDBConnection
console.log(`dbURI ${dbURI}`)
const MongoClient = require('mongodb').MongoClient;
let db

app.use(cookieParser())
app.use(express.static('.'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

server.listen(port, '0.0.0.0', () => {
    console.log(`listening on ${port}`)
})

MongoClient.connect(dbURI, (err, client) => {
  console.log(`Connected successfully to mongo`);
  db = client.db(dbName);
});
