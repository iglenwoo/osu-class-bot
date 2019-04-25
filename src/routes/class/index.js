const fetch = require('node-fetch')
const cheerio = require('cheerio')

const fetchProf = async (url) => {
  if (!url) return

  const response = await fetch(url)
  const body = await response.text()

  const $ = cheerio.load(body)
  const html = $('div[class="breakdown-wrapper"]')
  const quality = html.find('.quality-header').find('.grade').text().trim()
  const takeAgain = html.find('.takeAgain').find('.grade').text().trim()
  const difficulty = html.find('.difficulty').find('.grade').text().trim()

  return {
    quality,
    takeAgain,
    difficulty,
  }
}

const searchProf = async (prof) => {
  if (!prof) return

  const name = prof.replace(' ', '+')

  const url = `https://www.ratemyprofessors.com/search.jsp?query=${name}`

  const response = await fetch(url)
  const data = await response.text()
  const $ = cheerio.load(data)
  const lis = $('li[class="listing PROFESSOR"]')

  let profLink
  for (let i in lis) {
    const html = cheerio.load(lis[i])
    const sub = html('.sub')
    const text = sub.text()
    if (text.includes('Oregon State University')) {
      const a = html('a')
      const target = a.attr('href')
      profLink = `https://www.ratemyprofessors.com${target}`
      // console.log(profLink)
    }
  }

  return profLink
}

const getInstructor = async (code, crn, srcdb) => {
  if (!code || !crn || !srcdb) return

  const url = 'https://classes.oregonstate.edu/api/?page=fose&route=details'
  const body = `{"group":"code:${code}","key":"crn:${crn}","srcdb":"${srcdb}","matched":"crn:${crn}"}`

  const response = await fetch(url, { method: 'POST', body })
  const data = await response.text()
  const json = JSON.parse(data)
  const $ = cheerio.load(json.instructordetail_html)
  return $('.instructor-detail').text()
}

const searchOsuClass = async classCode => {
  if (!classCode) return

  const url = 'https://classes.oregonstate.edu/api/?page=fose&route=search'
  const body = `{"other":{"srcdb":"999999"},"criteria":[{"field":"alias","value":"${classCode}"}]}`

  const response = await fetch(url, {
    method: 'POST',
    body,
  })
  const json = await response.json()
  let result
  if (json && json.results) {
    if (json.results.length === 0) {
      // todo: no result ?
    }
    if (json.results.length === 1) {
      result = json.results[0]
    } else {
      // todo: multiple classes ?
    }
  } else {
    // todo: error
  }

  return result
}

const generateMessage = async (classCode) => {
  const osuClass = await searchOsuClass(classCode)
  if (!osuClass) {
    throw new Error(`No class found (${classCode})`)
  }

  const instructor = await getInstructor(osuClass.code, osuClass.crn, osuClass.srcdb)
  if (!instructor) {
    throw new Error(`No instructor found with (code:${osuClass.code}, crn:${osuClass.crn}, srcdb:${osuClass.srcdb})`)
  }

  const profUrl = await searchProf(instructor)
  if (!profUrl) {
    throw new Error(`No url found with (${instructor})`)
  }

  const res = await fetchProf(profUrl)
  if (!res) {
    throw new Error(`No professor data from (${profUrl})`)
  }

  return res
}

let message = {
  text: 'Text message',
  attachments: [(text = 'Sub text...')],
}

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json')

  generateMessage(req.body.text)
    .then(({ quality, takeAgain, difficulty }) => {
      message.text = `quality: ${quality}, takeAgain: ${takeAgain}, difficulty: ${difficulty}`
      console.log(message.text)
    })
    .catch((err) => {
      console.log(err.toString())
      message.text = err.toString()
      console.log(message.text)
    })
    .finally(() => {
      console.log(message.text)
      const stringified = JSON.stringify(message)
      res.end(stringified)
    })
}
