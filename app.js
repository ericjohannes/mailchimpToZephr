// following this to install nvm and node on ec2 https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-up-node-on-ec2-instance.html
// curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
// . ~/.nvm/nvm.sh
// nvm install node 17.3.1
// node -e "console.log('Running Node.js ' + process.version)"
// ran `npm install` in my project folder


// todo check for user agent "user-agent": "MailChimp" in headers
const express = require('express')
const dotenv = require('dotenv')
const CryptoJS = require("crypto-js");
const https = require('https')
const fs = require('fs')
const parseArgs = require('minimist')
const argv = parseArgs(process.argv.slice(2), opts = { 'boolean': ['dev'] })

class MakeRequest {
    constructor() {
        this.accessKey = process.env.zephrAccessKey;
        this.secretKey = process.env.zephrSecretKey;
        this.baseOptions = {
            headers: {
                'User-Agent': 'PostmanRuntime/7.29.0'
            },
            hostname: "protocol.api.zephr.com",
        }
    }

    _makeHash = ({ path, method, query, body }) => {
        const timestamp = new Date().getTime().toString();
        const nonce = (Math.random()).toString();

        let hash = CryptoJS.algo.SHA256.create()

        hash.update(this.secretKey)
        if (body && body.length) {
            hash.update(body)
        }
        hash.update(path)
        if (query) {
            hash.update(query)
        }
        hash.update(method)
        hash.update(timestamp)
        const hashString = hash.update(nonce)
            .finalize()
            .toString()

        console.log('path', path)
        console.log('method', method)
        console.log('query', query)
        console.log('body', body)

        const hmac = `ZEPHR-HMAC-SHA256 ${this.accessKey}:${timestamp}:${nonce}:${hashString}`.replace(/\r?\n|\r/, "");
        console.log('hmac', hmac)
        return hmac
    }

    _makeOptions = (data) => {
        const { path, method, query, bodyData } = data;
        const authHeader = this._makeHash({ path: path, method: method, query: query, body: bodyData });
        let pathWithQuery = path;
        if (query) {
            pathWithQuery += '?' + query;
        }

        const options = Object.assign(this.baseOptions, { method: method, path: pathWithQuery });
        options.headers.Authorization = authHeader;
        return options
    }

    makeEmailRequest = async (email) => {
        const emailQuery = `identifiers.email_address=${email}`
        var emailPath = "/v3/users"

        const result = await this._makeRequest({ path: emailPath, method: 'GET', query: emailQuery })
        console.log('makeEmailRequest result', result)

        const userPath = `/v3/users/${result.user_id}`;
        const unsubAll = {
            policy: false,
            alerts: false,
            braintrust: false,
            china: false,
            climate: false,
            enterprise: false,
            entertainment: false,
            fintech: false,
            newsletter: false,
            pipeline: false,
            policy: false,
            "source-code": false,
            workplace: false,
        }
        const patchPath = `/v3/users/${result.user_id}/attributes`
        const secondResult = await this._makeRequest({ path: patchPath, method: 'PATCH', body: unsubAll });
        const thirdResult = await this._makeRequest({ path: userPath, method: 'GET' });
        console.log('thirdResult', thirdResult)
        return secondResult
    }

    _makeRequest = (data) => {
        /* method should be GET, POST, PATCH etc.
         *  
         *
         * 
         */
        const { path, method, query, body } = data;
        let bodyData = body ? JSON.stringify(body) : null; // GET requests should have no body, POSTs do
        const options = this._makeOptions({ path, method, query, bodyData });
        return new Promise((resolve, reject) => {
            const req = https.request(options, res => {
                res.setEncoding('utf8');
                let responseBody = '';

                res.on('data', (chunk) => {
                    responseBody += chunk;
                });
                res.on('end', () => {
                    resolve(JSON.parse(responseBody));
                });
            })
            req.on('error', (err) => {
                reject(err);
            });
            if (bodyData) {
                req.write(bodyData);
            }
            req.end();
        });
    }
}


dotenv.config();

const app = express();
const port = argv['port'];

const makeRequest = new MakeRequest();

const sendToSlack = (msg) => {
    const slackToken = process.env.slackToken
    const req = https.request({
        headers: {
            'User-Agent': 'MailChimpToZephr Test',
            'Content-Type': 'application/json',
            authorization: `Bearer ${slackToken}`
        },
        hostname: "slack.com",
        path: "/api/chat.postMessage",
        method: 'POST',

    }, res => {
        res.setEncoding('utf8');
        let responseBody = '';

        res.on('data', (chunk) => {
            responseBody += chunk;
        });
        res.on('end', () => {
            return
            // console.log('end', JSON.parse(responseBody));
        });
    })
    req.on('error', (err) => {
        console.log('err', (err));
    });
    req.write(JSON.stringify({
        channel: '#mailchimp-zephr-app',
        text: msg,
    }));
    req.end();
}

const devStuff = (req) => {
    // for dev purposes...
    const timeStamp = + new Date();
    //const headers = JSON.stringify(req.headers);
    fs.writeFileSync(`./data/${timeStamp}_headers.json`, JSON.stringify(req.headers, null, 2), 'utf-8');
    // const fileBodyData = JSON.parse(req.body.data);
    if(req.body && req.body.data){
        fs.writeFileSync(`./data/${timeStamp}_fileBodyData.json`, JSON.stringify(req.body.data, null, 2), 'utf-8');
    }
}
app.use(express.json());
app.use(express.urlencoded()); // to support URL-encoded bodies

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
        if (req.body.type === "unsubscribe") {   // check if it's an unsubscribe

            const bodyData = JSON.parse(req.body.data)
            console.log(`Request to unsubscribe ${bodyData.email}`)

            // start process with zephr to unsubscribe them
            // const result = makeRequest.makeEmailRequest(req.body.email)
            res.send('{"result":"unsubscribed"}')
            // res.sendStatus(200);

        } else {
            res.send('{"result":"not an unsubscribe"}')
        }
    } catch (err) {
        sendToSlack(err.stack)
    }
});

app.listen(port, () => {
    try {
        console.log(`Example app listening at http://localhost:${port}`)
    } catch (err) {
        sendToSlack(err.stack)
    }
})