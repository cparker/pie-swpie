'use strict'

const express = require('express')
const port = process.env.PORT || 5000
const app = express()
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const server = require('http').createServer(app)
const mongodb = require('mongodb')
const defaultDBConnection = `mongodb://localhost/pie-swipe`
const dbURI = process.env.MONGODB_URI || defaultDBConnection
const dbName = dbURI.substr(dbURI.lastIndexOf('/') + 1) // dumb
console.log(`dbURI ${dbURI}`)
const MongoClient = require('mongodb').MongoClient;
const cookieName = 'pieSwipeID'
const defaultAppName = 'pie-swipe'
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

/*
  given a collection name, and a url 
    move a vote from up to down if the vote is 1, 
    move a vote from down to up of the vote is -1
*/
async function changeVote(imageColName, url, vote) {
    const voteChangeUpdate = vote === 1 ? {
        "$inc": {
            totalUp: 1,
            totalDown: -1
        }
    } : {
        "$inc": {
            totalUp: -1,
            totalDown: 1
        }
    }

    await db.collection(imageColName)
        .update({
            url: url
        }, voteChangeUpdate)
}

/*
  given the name of the image collection, a url, and a vote (1 | -1)
  tally the totalUp, totalDown for the url

*/
async function tallyVote(imageColName, url, vote) {

    const imageRecord = await db.collection(imageColName)
        .findOne({
            url: url
        })

    if (imageRecord) {
        // we have a record of this image already, simply tally the vote
        const upVote = {
            "$inc": {
                totalUp: 1
            }
        }

        const downVote = {
            "$inc": {
                totalDown: 1
            }
        }

        const voteUpdate = vote === 1 ? upVote : downVote

        await db.collection(imageColName)
            .updateOne({
                url: url
            }, voteUpdate)
    } else {
        // first time anyone is voting for this image
        const initialUpVote = {
            url: url,
            totalUp: 1,
            totalDown: 0
        }
        const initialDownVote = {
            url: url,
            totalUp: 0,
            totalDown: 1
        }
        const initialVote = vote === 1 ? initialUpVote : initialDownVote
        await db.collection(imageColName)
            .insertOne(initialVote)
    }
}

// handle POST of /swipe
/*
  we have a cookieID and an image url, and we want to record an up or down vote
  a person (cookie) only gets one vote
  we'd like to quickly access the total votes by key

  image collection : { url, totalUp, totalDown} // one entry per image, pretty big
  user vote collection : { clientId, url, vote} // one entry per user, per image , really BIG

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

      JSON body looks like 
      {
          "appName" : "", // name of the app, like pieSwipe, or kitten, or , ....
          "url" : "....",
          "clientId" : "....", // the cookie
          "vote" : 1 // 1 | -1
      }
*/
app.post('/swipe', async (req, res, next) => {
    console.log('body', req.body)

    // prepend the appName to the col name
    const userVoteColName = `${req.body.appName}-userVotes`
    const imageColName = `${req.body.appName}-images`
    const clientId = req.cookies[cookieName]

    const userVoteRecord = await db.collection(userVoteColName)
        .findOne({
            clientId: clientId,
            url: req.body.url
        })

    if (!userVoteRecord) {
        // user has not voted yet

        // record the user's vote in the userVote collection
        await db.collection(userVoteColName)
            .insertOne({
                clientId: clientId,
                url: req.body.url,
                vote: req.body.vote
            })

        // then update the total votes for the image
        await tallyVote(imageColName, req.body.url, req.body.vote)
    } else {
        console.log(`user ${clientId} has already voted for ${req.body.url}`)
        // user has already voted
        if (req.body.vote !== userVoteRecord.vote) {
            console.log(`user ${clientId} is changing their vote on ${req.body.url} from ${userVoteRecord.vote} to ${req.body.vote}`)
            // only need to do work if they are changing their vote
            await db.collection(userVoteColName)
                .updateOne({
                    clientId: clientId,
                    url: req.body.url
                }, {
                    "$set": {
                        vote: req.body.vote
                    }
                })

            // they changed their vote, so we need to move 1 vote from up to down, or vice versa
            await changeVote(imageColName, req.body.url, req.body.vote)
        }
    }

    console.log('got userVoteRecord', userVoteRecord)

    res.sendStatus(200)
})

app.get('/swipe', async (req, res, next) => {
    console.log('req.query', req.query)
    const imageColName = `${req.query.appName}-images`
    const imageRecord = await db.collection(imageColName).findOne({
        url: req.query.url
    })
    res.json(imageRecord)
})


server.listen(port, '0.0.0.0', () => {
    console.log(`listening on ${port}`)
})

MongoClient.connect(dbURI, (err, client) => {
    // this is really dumb
    console.log(`Connected successfully to mongo ${dbURI}`);
    db = client.db(dbName)
});