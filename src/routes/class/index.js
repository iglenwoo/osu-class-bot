const request = require('request')
const cheerio = require('cheerio')

const fetchProf = (url) => {
  request.get(
    {
      url,
    },
    (err, response, body) => {
      console.log('error:', err)
      console.log('httpResponse:', response && response.statusCode)
      console.log('body:', body)
      const $ = cheerio.load(body)
      const html = $('div[class="breakdown-wrapper"]')
      const quality = html.find('.quality-header').find('.grade')
      console.log(quality.text().trim())
      const takeAgain = html.find('.takeAgain').find('.grade')
      console.log(takeAgain.text().trim())
      const difficulty = html.find('.difficulty').find('.grade')
      console.log(difficulty.text().trim())
    }
  )
}

const searchProf = prof => {
  const name = prof.replace(' ', '+')

  const url = `https://www.ratemyprofessors.com/search.jsp?query=${name}`
  console.log(url)

  request.get(
    {
      url,
    },
    (err, response, body) => {
      console.log('error:', err)
      console.log('httpResponse:', response && response.statusCode)
      console.log('body:', body)
      const $ = cheerio.load(body)
      // const profs = $('div', '#searchResultsBox').find('li[class="listing PROFESSOR"]');
      const lis = $('li[class="listing PROFESSOR"]')
      Object.values(lis).forEach(li => {
        const html = cheerio.load(li)
        const sub = html('.sub')
        const text = sub.text()
        if (text.includes('Oregon State University')) {
          const a = html('a')
          const target = a.attr('href')
          const newLink = `https://www.ratemyprofessors.com${target}`
          console.log(newLink)
          fetchProf(newLink)
        }
      })
    }
  )
}

const fetchClassDetails = (code, crn, srcdb) => {
  const headers = {
    contentType: 'application/json',
  }
  const url = 'https://classes.oregonstate.edu/api/?page=fose&route=details'
  const body = `{"group":"code:${code}","key":"crn:${crn}","srcdb":"${srcdb}","matched":"crn:${crn}"}`

  request.post(
    {
      headers,
      url,
      body,
    },
    (err, response, body) => {
      console.log('error:', err)
      console.log('httpResponse:', response && response.statusCode)
      console.log('body:', body)
      const json = JSON.parse(body)
      const $ = cheerio.load(json.instructordetail_html)
      const instructor = $('.instructor-detail').text()
      searchProf(instructor)
    }
  )
}

const searchClass = classCode => {
  const headers = {
    contentType: 'application/json',
  }
  const url = 'https://classes.oregonstate.edu/api/?page=fose&route=search'
  const body = `{"other":{"srcdb":"999999"},"criteria":[{"field":"alias","value":"${classCode}"}]}`

  request.post(
    {
      headers,
      url,
      body,
    },
    (err, response, body) => {
      console.log('error:', err)
      console.log('httpResponse:', response && response.statusCode)
      console.log('body:', body)
      const json = JSON.parse(body)
      // todo: multiple classes ?
      Object.values(json.results).forEach(result => {
        // todo: no result ?
        fetchClassDetails(result.code, result.crn, result.srcdb)
      })
    }
  )
}

let message = {
  text: 'Text message',
  attachments: [(text = 'Sub text...')],
}

module.exports = (req, res) => {
  searchClass(req.body.text)

  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(message))
}
