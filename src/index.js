const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const port = 4000;

app.use(bodyParser.json()); // for parsing application/json
// NOTE: 'parsing application/x-www-form-urlencoded' is necessary.
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.get('/', (req, res) => res.send('Not supported'));

let message = {
    text: 'Text message',
    attachments: [
        text = 'Sub text...'
    ]
};

const parseQueryString = (query) => {
    if (!query) return;

    const parts = query.split(' ');
    const majorClassNum = parts[0];// todo: split to major and classNum

    let major, classNum;

    return {
        major, classNum
    }
};

const fetchOSUClass = (major, classNum) => {
    // https://classes.oregonstate.edu/api/?page=fose&route=search&alias=cs553
    request.get(`https://classes.oregonstate.edu/api/?page=fose&route=search&subject=${major}${classNum}`);
};

app.post('/class', (req, res) => {
    console.log(req.body); // todo: pass req.body.text to parser

    // TODO: get class info

    // TODO: get professor rating

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(message));
});

app.post('/prof', (req, res) => {

});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));