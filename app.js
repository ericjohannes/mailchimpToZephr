// following this to install nvm and node on ec2 https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-up-node-on-ec2-instance.html
// curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
// . ~/.nvm/nvm.sh
// nvm install node 17.3.1
// node -e "console.log('Running Node.js ' + process.version)"
// ran `npm install` in my project folder

const express = require('express')
const dotenv = require('dotenv')
const parseArgs = require('minimist')

const { simpleCheck, devStuff, sendToSlack } = require('./helpers');
const { MakeRequest } = require('./makeRequest');

const argv = parseArgs(process.argv.slice(2), opts = { 'boolean': ['dev'] })

dotenv.config();

const app = express();
const port = argv['port'];

const makeRequest = new MakeRequest();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies

app.get('/', (req, res) => {
    try {
        if (argv['dev']) {
            devStuff(req)
        }
        res.sendFile(__dirname + '/index.html');
    } catch (err) {
        sendToSlack(err.stack)
    }
});

app.head('/', (req, res) => { // mailchimp sends a head request to test the endpoint
    try {
        if (argv['dev']) {
            devStuff(req)
        }
        res.sendStatus(200);
    } catch (err) {
        sendToSlack(err.stack)
    }
});

app.post('/', (req, res) => {
    try {
        if (argv['dev']) {
            devStuff(req)
        }
        if (req.body.type === "unsubscribe" && simpleCheck(req)) {   // check if it's an unsubscribe and if it's valid
            // start process with zephr to unsubscribe them
            const result = makeRequest.makeEmailRequest(req.body.data.email)
            res.send('{"result":"unsubscribed"}')

        } else {
            res.send('{"result":"not an unsubscribe"}')
        }
    } catch (err) {
        sendToSlack(err.stack)
    }
});

app.listen(port, () => {
    try {
        console.log(`Listening at http://localhost:${port}`)
    } catch (err) {
        sendToSlack(err.stack)
    }
})