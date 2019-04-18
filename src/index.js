const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const port = 4000;

app.use(bodyParser.json()); // for parsing application/json
// NOTE: 'parsing application/x-www-form-urlencoded' is necessary.
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', (req, res) => res.send('Not supported'));

const fetchOSUClass = (classCode) => {

    const headers = {
        contentType: 'application/json'
    };
    const url = 'https://classes.oregonstate.edu/api/?page=fose&route=search';
    const body = `{"other":{"srcdb":"999999"},"criteria":[{"field":"alias","value":"${classCode}"}]}`;

    request.post({
        headers,
        url,
        body
    }, (err, response, body) => {
        console.log('error:', err); // Print the error if one occurred
        console.log('httpResponse:', response && response.statusCode); // Print the response status code if a response was received
        console.log('body:', body); // Print the HTML for the Google homepage.
    });
};

let message = {
    text: 'Text message',
    attachments: [
        text = 'Sub text...'
    ]
};

app.post('/class', (req, res) => {
    // TODO: get class info
    fetchOSUClass(req.body.text);

    // TODO: get professor rating

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(message));
});

app.post('/prof', (req, res) => {

});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));