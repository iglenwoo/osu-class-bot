const {
  searchProfessors,
  pushProfessorDetailsTo,
  pushCloneDetails,
  CACHE_MAX_MIN_IN_MS
} = require('../utils')
const { SLACK } = require('../../models')

const generateMessage = async (name) => {
  let message
  let attachment

  try {
    message = JSON.parse(JSON.stringify(SLACK.MESSAGE))
    message.text = `Searched by \`/prof ${name}\``

    attachment = JSON.parse(JSON.stringify(SLACK.ATTACHMENT)) // deep copy

    const professors = await searchProfessors(name)
    for (const professor of professors) {
      attachment = JSON.parse(JSON.stringify(SLACK.ATTACHMENT)) // deep copy

      pushProfessorDetailsTo(attachment, professor)

      pushCloneDetails(message, attachment)
    }
  } catch (err) {
    attachment.color = 'danger'
    attachment.text = err.toString()
    pushCloneDetails(message, attachment)
  }

  return message
}

let history = new Map()

const searchHistory = (code) => {
  const message = history.get(code)
  if (message && Date.now() - message.created > CACHE_MAX_MIN_IN_MS) {
    history.delete(code)
    return;
  }

  return message
}
const saveHistory = (code, value) => {
  history.set(code, value)
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')

  let message = searchHistory(req.body.text)
  if (!message) {
    message = await generateMessage(req.body.text)
    message.created = Date.now()
    saveHistory(req.body.text, message)
  }

  const messageStr = JSON.stringify(message)
  res.end(messageStr)
}