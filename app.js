// following this to install nvm and node on ec2 https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-up-node-on-ec2-instance.html
// curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
// . ~/.nvm/nvm.sh
// nvm install node 17.3.1
// node -e "console.log('Running Node.js ' + process.version)"
// ran `npm install` in my project folder

// todo:
// add pm2
// add certs path for prod

const express = require('express');
const https = require("https");
const dotenv = require('dotenv');
const parseArgs = require('minimist');
const fs = require('fs');

const { sendToSlack }= require('./code/helpers');

const getRoutes = require('./routes/get');

const headRoutes = require('./routes/head');
const postRoutes = require('./routes/post');

const argv = parseArgs(process.argv.slice(2), opts = { 'boolean': ['dev'] });

dotenv.config();

const app = express();
const port = argv['port'];


app.use(express.json());
app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies

app.use(getRoutes);
app.use(postRoutes);
app.use(headRoutes);


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

https
  .createServer(options, app)
  .listen(port, ()=>{
    try {
        console.log(`Listening at https://localhost:${port}`)
    } catch (err) {
        sendToSlack(err.stack)
    }
});
