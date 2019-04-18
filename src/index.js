const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const cheerio = require('cheerio');
const app = express();
const port = 4000;

app.use(bodyParser.json());
// NOTE: 'parsing application/x-www-form-urlencoded' is necessary.
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', (req, res) => res.send('Not supported'));

const fetchClassDetails = (code, crn, srcdb) => {
    const headers = {
        contentType: 'application/json'
    };
    const url = 'https://classes.oregonstate.edu/api/?page=fose&route=details';
    const body = `{"group":"code:${code}","key":"crn:${crn}","srcdb":"${srcdb}","matched":"crn:${crn}"}`;

    request.post({
        headers,
        url,
        body
    }, (err, response, body) => {
        console.log('error:', err);
        console.log('httpResponse:', response && response.statusCode);
        console.log('body:', body);
        const json = JSON.parse(body);
        const $ = cheerio.load(json.instructordetail_html);
        const instructor = $('.instructor-detail').text();
        //todo : search this on ratemyprofessor
    });
};

const searchClass = (classCode) => {
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
        console.log('error:', err);
        console.log('httpResponse:', response && response.statusCode);
        console.log('body:', body);
        const json = JSON.parse(body);
        Object.values(json.results).forEach((result) => {
            fetchClassDetails(result.code, result.crn, result.srcdb);
        });
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
    searchClass(req.body.text);

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(message));
});

app.post('/prof', () => {

});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));