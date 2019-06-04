module.exports = async (req, res) => {
  res.sendFile(__dirname + '/add_to_slack.html')
}