const {
  getClassDetails,
  getInstructor,
  searchClasses,
  searchProfessors,
  pushProfessorDetailsTo,
  pushFieldTo,
  pushCloneDetails,
  CACHE_MAX_MIN_IN_MS
} = require('../utils')
const { SLACK } = require('../../models')

const validateOsuClass = (osuClass) => {
  if (!osuClass) {
    throw Error('Failed to get')
  }
  if (!osuClass.code) {
    throw Error('Failed to get class code')
  }
  if (!osuClass.crn) {
    throw Error('Failed to get crn')
  }
  if (!osuClass.srcdb) {
    throw Error('Failed to get srcdb')
  }

  return osuClass
}

const generateAttachmentByClass = async (osuClass, classCode) => {
  let attachment = JSON.parse(JSON.stringify(SLACK.ATTACHMENT)) // deep copy
  attachment.title = classCode.toUpperCase()

  const { code, crn, srcdb, start_date, end_date, title } = validateOsuClass(osuClass)
  attachment.title =  `${attachment.title} - ${title}`

  const classDetails = await getClassDetails(code, crn, srcdb)
  pushFieldTo(attachment, 'Campus', classDetails.campus)
  pushFieldTo(attachment, 'Credits', classDetails.hours_html)
  pushFieldTo(attachment, 'Start Date', start_date)
  pushFieldTo(attachment, 'End Date', end_date)

  const instructor = getInstructor(classDetails)

  const professors = await searchProfessors(instructor)
  if (professors.length !== 1) {
    attachment.color = 'danger'
    attachment.text = `Failed to find \`${instructor}\` on www.ratemyprofessors.com`
    return attachment
  }

  const professor = professors[0]
  pushProfessorDetailsTo(attachment, professor)

  return attachment
}

const generateMessage = async (classCode) => {
  let message;
  let attachment;

  try {
    message = JSON.parse(JSON.stringify(SLACK.MESSAGE))
    message.text = `Searched by \`/class ${classCode}\``

    attachment = JSON.parse(JSON.stringify(SLACK.ATTACHMENT))

    const classes = await searchClasses(classCode)
    for (const c of classes) {
      attachment = await generateAttachmentByClass(c, classCode)

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
