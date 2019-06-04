const fetch = require('node-fetch')

const auth = async (req) => {
  const uri = 'https://slack.com/api/oauth.access' +
  '?code=' + req.query.code +
  '&client_id=' + process.env.CLIENT_ID +
  '&client_secret=' + process.env.CLIENT_SECRET +
  '&redirect_uri=' + process.env.REDIRECT_URI;

  const response = await fetch(uri, { method: 'GET' })
  const json = await response.json()

  return json
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  let jsonResponse = ''

  try {
    const jsonResponse = await auth(req)
    res.send("Success!")
  } catch (err) {
    console.log(err)
    res.send("Sorry, error encountered").status(200).end()
  }
}