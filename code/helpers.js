const dotenv = require('dotenv');
const fs = require('fs');
const https = require('https');

dotenv.config();

const userAgentCheck = (req)=>{
    const userAgents = ['MailChimp', 'MailChimp.com WebHook Validator', 'MailChimpToZephr Test']
    return userAgents.includes(req.headers["user-agent"])
}

const simpleCheck = (req) => {
    const listId = process.env.listId;
    return (req.body.data.list_id === listId && userAgentCheck(req))
}

const devStuff = (req) => {
    // for dev purposes...
    const timeStamp = + new Date();
    //const headers = JSON.stringify(req.headers);
    fs.writeFileSync(`./data/${timeStamp}_headers.json`, JSON.stringify(req.headers, null, 2), 'utf-8');
    // const fileBodyData = JSON.parse(req.body.data);
    if (req.body) {
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

const buildUnsubBody = () => {
    return {
        policy: false,
        alerts: false,
        braintrust: false,
        china: false,
        climate: false,
        enterprise: false,
        entertainment: false,
        fintech: false,
        gaming: false,
        newsletter: false,
        pipeline: false,
        policy: false,
        "source-code": false,
        workplace: false,
    }
}

const buildPatchBody = (groupsString) => {
    const groups = groupsString.split(",").map(item => item.trim()); // split on , and trim whitespace

    let groupsBody = {};
    // const groupsKey = {
    //     "Protocol Alerts": "alerts",
    //     Braintrust: "braintrust",
    //     China: "china",
    //     Climate: "climate",
    //     Cloud: "enterprise",
    //     Entertainment: "entertainment",
    //     FinTech: "fintech",
    //     Gaming: "gaming",
    //     // Index: "index", // index is not in zephr
    //     Pipeline: "pipeline",
    //     Policy: "policy",
    //     "Source Code": "source-code",
    //     Workplace: "workplace",
    // }
    const renameGroup = (groupName)=>{
        let newName = "alerts"; // only  "Protocol Alerts" doesn't follow the pattern
        if(groupName !=  "Protocol Alerts"){
            newName = groupName.toLowerCase(); // others are all lower case and use - instead of space
            newName = newName.replace(" ", "-");
        }
        return newName
    }
    groups.forEach(group => {
        let name = renameGroup(group);
        if(name){
            groupsBody[name] = true;
        }
        
    });

    // if the user is subbing to any newsletters (ie has any key in groups and the value for the key is true)
    if(Object.keys(groupsBody).length && groupsBody[Object.keys(groupsBody)[0]]){
        // make sure zephr knows they are a nl subscriber
        groupsBody['newsletter'] = true
    }
    return groupsBody
}

const policySyncWrapper = (groupsString)=>{
    // builds a patch body for the policy sync script (syncPolicy.js)
    // should  return only {Policy: true} rather than all the newsletters they are subbed to 
    // and only if they are subbed to Policy in mailchimp
    // Doing that to only touch the Policy stuff rather than all their subscriptions
    const newsletters = buildPatchBody(groupsString);
    if(newsletters.policy){
        return({policy: true, newsletter: true})
    } else{
        return false
    }
}

const oneNewsletterWrapper = (groupsString, newsletter )=>{
    // builds a patch body for sync script for one newsletter (like syncClimate.js)
    // should  return only {[newsletter]: true} rather than all the newsletters they are subbed to 
    // and only if they are subbed to that newsletter in mailchimp
    // Doing that to only touch the newsletter stuff rather than all their subscriptions
    const newsletters = buildPatchBody(groupsString);
    if(newsletters[newsletter]){
        return({[newsletter]: true, newsletter: true})
    } else{
        return false
    }
}

module.exports = { 
    simpleCheck, 
    devStuff, 
    sendToSlack, 
    buildUnsubBody, 
    buildPatchBody,
    policySyncWrapper,
    oneNewsletterWrapper,
    userAgentCheck
};