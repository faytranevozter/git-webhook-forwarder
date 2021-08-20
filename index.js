require('dotenv').config()
require('crypto')
const simpleGit = require('simple-git/promise')
const express = require('express')
const app = express()
const port = process.env.PORT || 3000

// helper
const helper = require('./helper')

// loggin git
const debug = require('debug')
debug.enable('simple-git,simple-git:*')

// middleware
const middle = require('./middleware')

app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use(middle.onlyPushEvent)
app.use(middle.verifyPostData)

app.post('/watchme', async (req, res) => {
  const payload = req.body
  const repoConfig = helper.findRepoByGithubURL(payload.repository.url)

  if (repoConfig === false) {
    return res.json({
      message: 'nothing forwarded'
    })
  }

  const pushedBranch = payload.ref.replace(/^refs\/heads\//, '')
  if (!repoConfig.branch.includes(pushedBranch)) {
    return res.json({
      message: `nothing forwarded on branch ${pushedBranch}`
    })
  }

  // check if delete branch
  if (payload.deleted) {
    return res.json({
      message: `nothing forwarded on delete branch ${pushedBranch}`
    })
  }

  try {
    const git = simpleGit(repoConfig.origin_path, {})

    // check remote git
    const remoteShouldHave = [repoConfig.origin_remote, repoConfig.destination_remote]
    const remotes = await git.getRemotes()
    const remoteMap = remotes.map(v => v.name)
    if (!helper.checkRemoteExist(remoteShouldHave, remoteMap)) {
      return res.json({
        message: 'remote not valid/complete'
      })
    }

    // fetch (in case dont have any branch)
    const resFetch = await git.fetch(repoConfig.origin_remote, pushedBranch)
    console.log('fetch: ', resFetch)

    // branch (check local branch exist)
    const resBranch = await git.branchLocal()
    if (!resBranch.all.includes(pushedBranch)) {
      // create new branch
      const resCheckout = await git.checkoutBranch(pushedBranch, `${repoConfig.origin_remote}/${pushedBranch}`)
      console.log('checkout: ', resCheckout)
    } else {
      // checkout branch
      const resCheckout = await git.checkout(pushedBranch)
      console.log('checkout: ', resCheckout)
    }

    // pull
    const resPull = await git.pull(repoConfig.origin_remote, pushedBranch)
    console.log('pull: ', resPull)

    // push
    const resPush = await git.push(repoConfig.destination_remote, pushedBranch)
    console.log('push: ', resPush)

    return res.json({
      message: 'forwarded'
    })
  } catch (err) {
    console.error(err)
    throw err
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
