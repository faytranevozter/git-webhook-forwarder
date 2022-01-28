require('dotenv').config()
require('crypto')
const express = require('express')
const app = express()
const port = process.env.PORT || 3000

// middleware
const middle = require('./middleware')
const push = require('./controllers/push')
const pullRequest = require('./controllers/pull_request')

app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

// app.use(middle.onlyPushPingEvent)
app.use(middle.verifyPostData)

app.post('/watchme', async (req, res) => {
  const ghEvent = req.get('X-Github-Event')
  if (ghEvent === 'ping') {
    return res.json({
      message: 'pong'
    })
  } else if (ghEvent === 'push') {
    push(req, res)
  } else if (ghEvent === 'pull_request') {
    pullRequest(req, res)
  }
})

app.use((err, req, res, next) => {
  if (err) {
    console.error(err)
    return res.status(500).json({
      message: 'Something went wrong'
    })
  }
})

app.listen(port, () => {
  console.log(`Webhook listening at http://localhost:${port}`)
})
