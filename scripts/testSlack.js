const https = require('https')
const dotenv = require('dotenv')


dotenv.config();
const slackToken = process.env.slackToken


const options = {
    headers: {
      'User-Agent': 'MailChimpToZephr Test',
      'Content-Type': 'application/json',
      authorization: `Bearer ${slackToken}`
    },
    hostname: "slack.com", 
    path: "/api/chat.postMessage",
    method: 'POST',
  }

const bodyData = JSON.stringify({
  channel: '#mailchimp-zephr-app',
  text: 'Hello, World!'
});
const req = https.request(options, res => {
    res.setEncoding('utf8');
    let responseBody = '';

    res.on('data', (chunk) => {
      responseBody += chunk;
    });
    res.on('end', () => {
      console.log('end', JSON.parse(responseBody));
    });      
})
req.on('error', (err) => {
  console.log('err', (err));
});
req.write(bodyData);
req.end();