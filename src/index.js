const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('Hello World!'));

let message = {
    text: 'Text message',
    attachments: [
        text = 'Sub text...'
    ]
};

app.post('/class', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(message));
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));