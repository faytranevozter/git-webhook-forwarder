require('dotenv').config()
const crypto = require('crypto')

const secret = process.env.SECRET_TOKEN

const onlyPushEvent = (req, res, next) => {
  if (req.get('X-Github-Event') === 'push') {
    return next()
  }

  return res.status(400).json({
    message: 'Only accept push event'
  })
}

const verifyPostData = (req, res, next) => {
  if (!req.body) {
    return res.status(400).json({
      message: 'Request body empty'
    })
  }

  const sig = Buffer.from(req.get('X-Hub-Signature-256') || '', 'utf8')
  const hmac = crypto.createHmac('sha256', secret)
  const digest = Buffer.from('sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex'), 'utf8')
  if (sig.length !== digest.length || !crypto.timingSafeEqual(digest, sig)) {
    return res.status(400).json({
      message: `Request body digest (${digest}) did not match X-Hub-Signature-256 (${sig})`
    })
  }

  return next()
}

module.exports = {
  onlyPushEvent,
  verifyPostData
}
