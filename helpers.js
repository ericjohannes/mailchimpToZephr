const dotenv = require('dotenv');
const fs = require('fs');
const https = require('https');

dotenv.config();

const simpleCheck = (req)=>{
    const listId = process.env.listId;
    const userAgents = ['MailChimp', 'MailChimp.com WebHook Validator', 'MailChimpToZephr Test']
    return (req.body.data.list_id === listId && userAgents.includes(req.headers["user-agent"]) )
}

const devStuff = (req) => {
    // for dev purposes...
    const timeStamp = + new Date();
    //const headers = JSON.stringify(req.headers);
    fs.writeFileSync(`./data/${timeStamp}_headers.json`, JSON.stringify(req.headers, null, 2), 'utf-8');
    // const fileBodyData = JSON.parse(req.body.data);
    if(req.body){
        fs.writeFileSync(`./data/${timeStamp}_fileBodyData.json`, JSON.stringify(req.body, null, 2), 'utf-8');
    }
}
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

module.exports = { simpleCheck, devStuff, sendToSlack};