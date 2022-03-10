// following this to install nvm and node on ec2 https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-up-node-on-ec2-instance.html
// curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
// . ~/.nvm/nvm.sh
// nvm install node 17.3.1
// node -e "console.log('Running Node.js ' + process.version)"
// ran `npm install` in my project folder


// todo:
// check for right list id

const express = require('express')
const dotenv = require('dotenv')
const parseArgs = require('minimist')

const { simpleCheck, devStuff, sendToSlack, buildUnsubBody, buildPatchBody }= require('./code/helpers');
const { MakeRequest } = require('./code/makeRequest');

const argv = parseArgs(process.argv.slice(2), opts = { 'boolean': ['dev'] })

dotenv.config();

const app = express();
const port = argv['port'];
const route = `/${process.env.route}`;

const makeRequest = new MakeRequest();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies

app.get(route, (req, res) => {
    try {
        if (argv['dev']) {
            devStuff(req)
        }
        res.sendFile(__dirname + '/index.html');
    } catch (err) {
        sendToSlack(err.stack)
    }
});

app.head(route, (req, res) => { // mailchimp sends a head request to test the endpoint
    try {
        if (argv['dev']) {
            devStuff(req)
        }
        res.sendStatus(200);
    } catch (err) {
        sendToSlack(err.stack)
    }
});

app.post(route, (req, res) => {
    try {
        let message = "unhandled webhook"
        if (argv['dev']) {
            devStuff(req)
        }
        if ((req.body.type === "unsubscribe" || req.body.type === "profile") && simpleCheck(req)) {   // check if it's an unsubscribe
            let patchBody = {};
            console.log(`Request to unsubscribe ${req.body.data.email}`)

            if (req.body.type === "unsubscribe") {
                patchBody = buildUnsubBody();
                message = `${req.body.data.email} unsubscribed`;
            } else if (req.body.type === "profile") {

                const newsletters = req.body.data.merges.GROUPINGS.filter(group => group.name == "Protocol Newsletters");
                if (newsletters.length && newsletters[0].groups && req.body.data.email) {
                    patchBody = buildPatchBody(newsletters[0].groups)
                    message = `Updating preferences for ${req.body.data.email}`;

                } else {
                    message = `Received profile update for ${req.body.data.email} but 'groups' not found!`
                }
            }

            // start process with zephr to update data
            const result = makeRequest.makePatchRequest(req.body.data.email, patchBody)

        }
        res.send(JSON.stringify({ "result": message }));
        sendToSlack(message)
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