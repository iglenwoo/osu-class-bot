const fetch = require('node-fetch')
const cheerio = require('cheerio')

const searchOsuClass = async classCode => {
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
      throw Error(`No class with code(${classCode})`)
    }
    if (json.results.length === 1) {
      result = json.results[0]
    } else {
      // todo: multiple classes -> pass prof names?
      throw Error(`Multiple classes found with code(${classCode})`)
    }
  } else {
    throw Error(`No class with code(${classCode})`)
  }

  return result
}

const getInstructor = async (code, crn, srcdb) => {
  const url = 'https://classes.oregonstate.edu/api/?page=fose&route=details'
  const body = `{"group":"code:${code}","key":"crn:${crn}","srcdb":"${srcdb}","matched":"crn:${crn}"}`

  const response = await fetch(url, { method: 'POST', body })
  const data = await response.text()
  const json = JSON.parse(data)
  const $ = cheerio.load(json.instructordetail_html)
  return $('.instructor-detail').text()
}

const searchProf = async (prof) => {
  if (!prof) {
    throw Error('Failed to get professor name')
  }

  const name = prof.replace(' ', '+')

  const url = `https://www.ratemyprofessors.com/search.jsp?query=${name}`

  const response = await fetch(url)
  const data = await response.text()
  const $ = cheerio.load(data)
  const lis = $('li[class="listing PROFESSOR"]')

  let profLink
  for (let i in lis) {
    if (lis.hasOwnProperty(i)) {
      const html = cheerio.load(lis[i])
      const sub = html('.sub')
      const text = sub.text()
      if (text.includes('Oregon State University')) {
        const a = html('a')
        const target = a.attr('href')
        profLink = `https://www.ratemyprofessors.com${target}`
      }
    }
  }

  return profLink
}

const fetchProf = async (url) => {
  if (!url) {
    throw Error('Failed to get an professor url on ratemyprofessors.com')
  }

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

module.exports = {
  searchOsuClass,
  getInstructor,
  searchProf,
  fetchProf
}