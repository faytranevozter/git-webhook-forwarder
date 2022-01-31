const { Octokit } = require('@octokit/core')
const { sendTelegram } = require('../helper')

module.exports = async (req, res) => {
  const payload = req.body
  const octokit = new Octokit({ auth: process.env.GH_PERSONAL_ACCESS_TOKEN })
  const user = await (new Octokit()).request('GET /users/{username}', {
    username: payload.sender.login
  })

  if (['opened', 'closed', 'review_requested'].includes(payload.action)) {
    let actionPR = payload.action
    if (payload.action === 'opened') {
      actionPR = '⏳ NEW PR'
    } else if (payload.action === 'review_requested') {
      actionPR = '🧑🏽‍🔧 ADD REVIEWER PR'
    } else if (payload.action === 'closed') {
      if (payload.pull_request.merged) {
        actionPR = '✅ MERGED PR'
      } else {
        actionPR = '❌ CLOSE PR'
      }
    }

    // commits
    const commits = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/commits', {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      pull_number: payload.pull_request.number
    })

    const msg = `--- ${actionPR} --- \nTitle: <a href="${payload.pull_request.html_url}">${payload.pull_request.title}</a> \nSender: <a href="${user.data.html_url}">${user.data.name}</a> \nRepo: <a href="${payload.repository.html_url}">${payload.repository.name}</a> \nBranch: ${payload.pull_request.head.ref} -> ${payload.pull_request.base.ref} \nTotal Commit: ${payload.pull_request.commits} \nAdditions: ${payload.pull_request.additions} \nDeletions: ${payload.pull_request.deletions} \nChanged Files: ${payload.pull_request.changed_files} \nCommits: ${commits.data.length > 0 ? `\n * ${commits.data.map(commit => commit.commit.message).join('\n * ')}` : ''}`

    const rawIDtoSend = process.env.BOT_TELEGRAM_TO_SEND || ''
    const arrID = rawIDtoSend.split(',')
    for (let i = 0; i < arrID.length; i++) {
      const id = arrID[i].trim()
      sendTelegram(id, msg)
    }
  }
}
