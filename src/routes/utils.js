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
      throw Error(`Sorry, no class with code(${classCode})`)
    }
    results = json.results
  } else {
    throw Error(`Sorry, no class with code(${classCode})`)
  }

  return results
}

const getClassDetails = async (code, crn, srcdb) => {
  const url = 'https://classes.oregonstate.edu/api/?page=fose&route=details'
  const body = `{"group":"code:${code}","key":"crn:${crn}","srcdb":"${srcdb}","matched":"crn:${crn}"}`

  const response = await fetch(url, { method: 'POST', body })
  const data = await response.text()

  return JSON.parse(data)
}

const getInstructor = (json) => {
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
    json.grouped.content_type_s.groups &&
    json.grouped.content_type_s.groups.length > 0) {
    for (const g of json.grouped.content_type_s.groups) {
      if (g && g.doclist && g.doclist.docs) {
        for (const doc of g.doclist.docs) {
          if (doc.schoolname_s &&
            doc.schoolname_s === 'Oregon State University') {
            professors.push(doc)
          }
        }
      }
    }
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

const pushProfessorDetailsTo = (attachment, professor) => {
  const url = `https://www.ratemyprofessors.com/ShowRatings.jsp?tid=${professor.pk_id}`
  pushFieldTo(attachment, 'Instructor', `_*<${url}|${professor.teacherfullname_s}>*_`)
  pushFieldTo(attachment, 'Department', professor.teacherdepartment_s)
  pushFieldTo(attachment, 'Overall Quality', professor.averageratingscore_rf)
  pushFieldTo(attachment, 'Difficulty', professor.averageeasyscore_rf)
}

const ONE_SEC_IN_MS = 1000
const ONE_MIN_IN_MS = ONE_SEC_IN_MS * 60
const ONE_HOUR_IN_MS = ONE_MIN_IN_MS * 60
const ONE_DAY_IN_MS = ONE_HOUR_IN_MS * 24
const CACHE_MAX_MIN_IN_MS = process.env.CACHE_MAX_MIN ? process.env.CACHE_MAX_MIN * ONE_MIN_IN_MS : ONE_DAY_IN_MS
console.log(`Set cache expired with '${CACHE_MAX_MIN_IN_MS / ONE_MIN_IN_MS}' min.`)

module.exports = {
  searchClasses,
  getClassDetails,
  getInstructor,
  extractNameForSearch,
  searchProf,
  fetchProf,
  searchProfessors,
  pushProfessorDetailsTo,
  pushFieldTo,
  pushCloneDetails,
  CACHE_MAX_MIN_IN_MS
}