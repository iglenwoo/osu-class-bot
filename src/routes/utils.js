const fetch = require('node-fetch')
const cheerio = require('cheerio')

const searchClasses = async classCode => {
  const url = 'https://classes.oregonstate.edu/api/?page=fose&route=search'
  const body = `{"other":{"srcdb":"999999"},"criteria":[{"field":"alias","value":"${classCode}"}]}`

  const response = await fetch(url, {
    method: 'POST',
    body,
  })
  const json = await response.json()
  let results = []
  if (json && json.results) {
    if (json.results.length === 0) {
      throw Error(`No class with code(${classCode})`)
    }
    results = json.results
  } else {
    throw Error(`No class with code(${classCode})`)
  }

  return results
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

const extractNameForSearch = (orgName) => {
  const nameParts = orgName.split(' ')
  const filtered = nameParts.filter((part, index) => {
    if (index === 0 || index === nameParts.length - 1)
      return part
  })

  return filtered.join('+')
}

const searchProf = async (prof) => {
  if (!prof) {
    throw Error('Failed to get professor name')
  }

  const name = extractNameForSearch(prof)

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

const searchProfessors = async (name) => {
  if (!name) {
    throw Error('Enter professor name')
  }

  const target = extractNameForSearch(name)

  const baseUrl = 'https://solr-aws-elb-production.ratemyprofessors.com//solr/rmp/select/?solrformat=true&rows=20&wt=json&json.wrf=noCB&callback=noCB&defType=edismax&qf=teacherfirstname_t%5E2000+teacherlastname_t%5E2000+teacherfullname_t%5E2000+autosuggest&bf=pow(total_number_of_ratings_i%2C1.7)&sort=score+desc&siteName=rmp&group=on&group.field=content_type_s&group.limit=20'
  const query = `&q=${target}+oregon+state+university`
  const url = baseUrl + query

  const response = await fetch(url, {
    method: 'GET'
  })
  const text = await response.text()
  let json
  if (text.length > 7) {
    const jsonText = text.substring(5, text.length - 1)
    json = JSON.parse(jsonText)
  } else {
    throw Error(`Failed to find professor \`${name}\``)
  }

  let professors = []
  if (json &&
    json.grouped &&
    json.grouped.content_type_s &&
    json.grouped.content_type_s.groups) {
    const groups = json.grouped.content_type_s.groups
    if (groups.length === 0) {
      throw Error(`No professor \`${name}\` on www.ratemyprofessors.com`)
    }

    for (const g of groups) {
      if (g && g.doclist && g.doclist.docs) {
        for (const doc of g.doclist.docs) {
          if (doc.schoolname_s &&
            doc.schoolname_s === 'Oregon State University') {
            professors.push(doc)
          }
        }
      }
    }
  } else {
    throw Error(`No professor \`${name}\``)
  }

  return professors
}

function pushFieldTo(message, fieldTitle, fieldValue, fieldShort = true) {
  message.fields.push({
    title: fieldTitle,
    value: fieldValue || 'None',
    short: fieldShort,
  })
}

function pushCloneDetails(message, details) {
  const clonedDetail = JSON.parse(JSON.stringify(details)) // deep copy
  message.attachments.push(clonedDetail);
}

module.exports = {
  searchClasses,
  getInstructor,
  extractNameForSearch,
  searchProf,
  fetchProf,
  searchProfessors,
  pushFieldTo,
  pushCloneDetails
}