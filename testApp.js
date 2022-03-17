// having trouble knowing if mailchimp is connecting ok or if their is a bug in the app
// run this to see if we get anything
// runs with a command line argument --port for port to listen to

const express = require('express')
const fs = require('fs');
const https = require("https");
const parseArgs = require('minimist')

const argv = parseArgs(process.argv.slice(2))

// get right certs on local machine or on ec2
const ec2CertsPath = "/etc/certs/wildcard_protocol.com";
let keyPath = 'certs/key.pem';
let certPath = 'certs/cert.pem';
if(fs.existsSync(ec2CertsPath)){
    keyPath = `${ec2CertsPath}/star_protocol_com.key`;
    certPath = `${ec2CertsPath}/star_protocol_com.crt`;
}
const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
};

const app = express();
const port = argv['port'];
app.all("*", (req, res, next) => {
    console.log(req); // do anything you want here
    next();
    res.sendStatus(200)
});

https
  .createServer(options, app)
  .listen(port, ()=>{
    try {
        console.log(`Listening at https://localhost:${port}`)
    } catch (err) {
        sendToSlack(err.stack)
    }
});