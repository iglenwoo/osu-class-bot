const {
  searchProfessors,
  pushFieldTo,
  pushCloneDetails
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

      const url = `https://www.ratemyprofessors.com/ShowRatings.jsp?tid=${professor.pk_id}`
      pushFieldTo(attachment, 'Instructor', `_*<${url}|${professor.teacherfullname_s}>*_`)
      pushFieldTo(attachment, 'Department', professor.teacherdepartment_s)
      pushFieldTo(attachment, 'Overall Quality', professor.averageratingscore_rf)
      pushFieldTo(attachment, 'Difficulty', professor.averageeasyscore_rf)

      pushCloneDetails(message, attachment)
    }
  } catch (err) {
    attachment.color = 'danger'
    attachment.text = err.toString()
    pushCloneDetails(message, attachment)
  }

  return message
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')

  const message = await generateMessage(req.body.text)

  const messageStr = JSON.stringify(message)
  res.send(messageStr)
}