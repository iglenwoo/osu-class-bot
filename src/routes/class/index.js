const {
  fetchProf,
  getInstructor,
  extractNameForSearch,
  searchClasses,
  searchProf,
  pushFieldTo,
  pushCloneDetails
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

function setRatingDetails(messageDetail, quality, takeAgain, difficulty) {
  pushFieldTo(messageDetail, 'Quality', quality)
  pushFieldTo(messageDetail, 'TakeAgain', takeAgain)
  pushFieldTo(messageDetail, 'Difficulty', difficulty)
}

const generateAttachmentByClass = async (osuClass, classCode) => {
  let attachment = JSON.parse(JSON.stringify(SLACK.ATTACHMENT)) // deep copy
  attachment.title = classCode.toUpperCase()

  const { code, crn, srcdb, start_date, end_date, title } = validateOsuClass(osuClass)
  attachment.title =  `${attachment.title} - ${title}`

  // todo: push - Campus, credit,
  pushFieldTo(attachment, 'Start Date', start_date)
  pushFieldTo(attachment, 'End Date', end_date)

  const instructor = await getInstructor(code, crn, srcdb)
  const name = extractNameForSearch(instructor)
  let profUrl = `https://www.ratemyprofessors.com/search.jsp?query=${name}`
  attachment.title_link = profUrl

  pushFieldTo(attachment, 'Instructor', instructor, false)

  profUrl = await searchProf(instructor)
  if (!profUrl){
    attachment.color = 'danger'
    attachment.text = `Failed to find \`${instructor}\` on www.ratemyprofessors.com`
    return attachment
  }
  attachment.title_link = profUrl

  const { quality, takeAgain, difficulty } =  await fetchProf(profUrl)

  setRatingDetails(attachment, quality, takeAgain, difficulty)

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

const ONE_SEC_IN_MS = 1000
const ONE_MIN_IN_MS = ONE_SEC_IN_MS * 60
const TEN_MIN_IN_MS = ONE_MIN_IN_MS * 10
const CACHE_MAX_MIN_IN_MS = process.env.CACHE_MAX_MIN ? process.env.CACHE_MAX_MIN * ONE_MIN_IN_MS : TEN_MIN_IN_MS

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

  const stringified = JSON.stringify(message)
  res.end(stringified)
}
