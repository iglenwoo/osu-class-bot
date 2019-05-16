const { fetchProf, getInstructor, searchOsuClass, searchProf } = require('../utils')

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
  pushFieldTo(messageDetail, 'Quality', quality, true)
  pushFieldTo(messageDetail, 'TakeAgain', takeAgain, true)
  pushFieldTo(messageDetail, 'Difficulty', difficulty, true)
}

function pushFieldTo(message, fieldTitle, fieldValue, fieldShort) {
  message.fields.push({
    title: fieldTitle,
    value: fieldValue,
    short: fieldShort,
  })
}

const generateMessage = async (classCode) => {
  const messageDetail = {
    color: 'good',
    title: '',
    title_link: '',
    text: '',
    fields: []
  }
  try {
    messageDetail.title =  classCode.toUpperCase()

    const osuClass = await searchOsuClass(classCode)
    const { code, crn, srcdb, start_date, end_date, title } = validateOsuClass(osuClass)
    messageDetail.title =  `${messageDetail.title} - ${title}`
    pushFieldTo(messageDetail, 'Start Date', start_date, true)
    pushFieldTo(messageDetail, 'End Date', end_date, true)

    const instructor = await getInstructor(code, crn, srcdb)
    const name = instructor.replace(' ', '+')
    let profUrl = `https://www.ratemyprofessors.com/search.jsp?query=${name}`
    messageDetail.title_link = profUrl

    pushFieldTo(messageDetail, 'Instructor', instructor, false)

    profUrl = await searchProf(instructor)
    messageDetail.title_link = profUrl

    const { quality, takeAgain, difficulty } =  await fetchProf(profUrl)

    setRatingDetails(messageDetail, quality, takeAgain, difficulty)
  } catch (err) {
    messageDetail.color = 'danger'
    messageDetail.text = err.toString()
  }

  return {
    attachments: [
      messageDetail
    ]
  }
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')

  const message = await generateMessage(req.body.text)
  const stringified = JSON.stringify(message)
  res.end(stringified)
}
