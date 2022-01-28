const { default: axios } = require('axios')
const repositories = require('./config')

const findRepoByGithubURL = (url) => {
  for (let i = 0; i < repositories.length; i++) {
    const repo = repositories[i]
    if (repo.origin_repo === url) {
      return repo
    }
  }
  return false
}

const checkRemoteExist = (shouldHave = [], availableRemotes = []) => {
  let totalFound = 0
  for (let i = 0; i < shouldHave.length; i++) {
    const remote = shouldHave[i]
    for (let j = 0; j < availableRemotes.length; j++) {
      const available = availableRemotes[j]
      if (remote === available) {
        totalFound++
      }
    }
  }
  return shouldHave.length === totalFound
}

const sendTelegram = (to, msg) => {
  const token = process.env.BOT_TELEGRAM_TOKEN || ''
  if (token !== '') {
    axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: to,
      text: msg,
      parse_mode: 'html',
      disable_web_page_preview: true
    })
  }
}

module.exports = {
  repositories,
  findRepoByGithubURL,
  checkRemoteExist,
  sendTelegram
}
