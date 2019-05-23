const {
  fetchProf,
  getInstructor,
  extractNameForSearch,
  searchClasses,
  searchProf,
  pushFieldTo,
  pushCloneDetails
} = require('../utils')

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

const generateMessage = async (classCode) => {
  const message = {
    text: `Searched by \`/class ${classCode}\``,
    attachments: []
  }

  const attachment = {
    color: 'good',
    title: classCode.toUpperCase(),
    title_link: '',
    text: '',
    fields: []
  }
  let messageDetail;

  try {
    const classes = await searchClasses(classCode)
    for (const c of classes) {
      messageDetail = JSON.parse(JSON.stringify(attachment)) // deep copy

      const { code, crn, srcdb, start_date, end_date, title } = validateOsuClass(c)
      messageDetail.title =  `${messageDetail.title} - ${title}`

      pushFieldTo(messageDetail, 'Start Date', start_date)
      pushFieldTo(messageDetail, 'End Date', end_date)

      const instructor = await getInstructor(code, crn, srcdb)
      const name = extractNameForSearch(instructor)
      let profUrl = `https://www.ratemyprofessors.com/search.jsp?query=${name}`
      messageDetail.title_link = profUrl

      pushFieldTo(messageDetail, 'Instructor', instructor, false)

      profUrl = await searchProf(instructor)
      messageDetail.title_link = profUrl

      const { quality, takeAgain, difficulty } =  await fetchProf(profUrl)

      setRatingDetails(messageDetail, quality, takeAgain, difficulty)

      pushCloneDetails(message, messageDetail)
    }
  } catch (err) {
    messageDetail.color = 'danger'
    messageDetail.text = err.toString()
    pushCloneDetails(message, messageDetail)
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
