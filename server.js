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
const cookieName = 'pieSwipeID'
let db

app.use(cookieParser())
app.use(express.static('.'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

// cors headers, to allow cross-site post
app.use((req, res, next) => {
    console.log(`req.headers.origin ${req.headers.origin}`)
    res.header("Access-Control-Allow-Credentials", "true")
    // todo check origin against a list so its not free for all
    res.header("Access-Control-Allow-Origin", `${req.headers.origin}`);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, contentType");
    res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE");
    next();
});

app.use((req, res, next) => {
    if (!req.cookies[cookieName]) {
        console.log('this user has no cookie, so sad')
        res.cookie(cookieName, (new Date()).getTime())
    } else {
        console.log('this user has a cookie', req.cookies[cookieName])
    }
    next()
})

// handle POST of /swipe
/*
  we have a cookieID and an image url, and we want to record an up or down vote
  a person (cookie) only gets one vote
  we'd like to quickly access the total votes by key

  image collection : { url, totalUp, totalDown} // one entry per image, pretty big
  user vote collection : { cookieId, url, vote} // one entry per user, per image , really BIG

  if user hasnt voted for url
    add entry to user vote collection
    if !image entry exists
       inc or dec image collection vote
    inc or dec image collection vote

 else if user has already voted for url
    if vote is same, no op
    else
      change vote in user vote collection
      change count in image collection
*/
app.post('/swipe', (req, res, next) => {
    console.log('body', req.body)
    res.sendStatus(200)
})


server.listen(port, '0.0.0.0', () => {
    console.log(`listening on ${port}`)
})

MongoClient.connect(dbURI, (err, client) => {
    console.log(`Connected successfully to mongo`);
    db = client.db(dbName);
});
