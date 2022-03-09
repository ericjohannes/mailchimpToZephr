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
<<<<<<< HEAD
const CryptoJS = require("crypto-js");
const https = require('https')
const fs = require('fs')
const parseArgs = require('minimist');
const { groupCollapsed } = require('console');
const argv = parseArgs(process.argv.slice(2), opts={'boolean': ['dev']})

const buildUnsubBody = ()=>{
  return {
    policy: false,
    alerts:false,
    braintrust:false,
    china:false,
    climate:false,
    enterprise:false,
    entertainment:false,
    fintech:false,
    newsletter:false,
    pipeline:false,
    policy:false,
    "source-code":false,
    workplace:false,
  }
}
const buildPathBody = (groupsString)=>{
  const groups = groupsString.split(",").map(item => item.trim()); // split on , and trim whitespace

  let groupsBody = {};
  const groupsKey = {
      "Protocol Alerts": "alerts",
      Braintrust: "braintrust",
      China: "china",
      Climate: "climate",
      Cloud: "enterprise",
      Entertainment: "entertainment",
      FinTech: "fintech",
      Pipeline: "pipeline",
      Policy: "policy",
      "Source Code": "source-code",
      Workplace: "workplace",
  }
  groups.forEach(group=>{
    let name = groupsKey[group]
    groupsBody[name] = true;
  });
  return groupsBody
}

class MakeRequest {
  constructor(){
    this.accessKey = process.env.zephrAccessKey;
    this.secretKey = process.env.zephrSecretKey;
    this.baseOptions = {
      headers: {
        'User-Agent': 'PostmanRuntime/7.29.0'
      },
      hostname: "protocol.api.zephr.com",  
    }
  }

  _makeHash = ( {path, method, query, body} )=>{
    const timestamp = new Date().getTime().toString();
    const nonce = (Math.random()).toString();
  
    let hash = CryptoJS.algo.SHA256.create()
  
    hash.update(this.secretKey)
    if(body  && body.length){
      hash.update(body)
    } 
    hash.update(path)
    if(query){
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

    const hmac = `ZEPHR-HMAC-SHA256 ${ this.accessKey}:${timestamp}:${nonce}:${hashString}`.replace(/\r?\n|\r/, "");
    console.log('hmac', hmac)
    return hmac
  }

  _makeOptions = (data)=>{
    const {path, method, query, bodyData} = data;
    const authHeader = this._makeHash({path: path, method:method, query: query, body: bodyData}); 
    let pathWithQuery = path;
    if(query){
      pathWithQuery += '?' + query;
    } 

    const options = Object.assign(this.baseOptions, {method: method, path: pathWithQuery});
    options.headers.Authorization = authHeader;
    return options
  }

  makePatchRequest = async (email, patchBody)=>{
    const emailQuery= `identifiers.email_address=${email}`
    var emailPath = "/v3/users"

    const result =  await this._makeRequest({path: emailPath, method:'GET', query: emailQuery})
    console.log('makePatchRequest result', result)
    
    const userPath = `/v3/users/${result.user_id}`;

    const patchPath = `/v3/users/${result.user_id}/attributes`
    const secondResult = await this._makeRequest({path: patchPath, method:'PATCH', body: patchBody});
    // const thirdResult = await this._makeRequest({path: userPath, method:'GET' });
    // console.log('thirdResult', thirdResult)
    return secondResult
  }

  _makeRequest = (data)=>{
    /* method should be GET, POST, PATCH etc.
     *  
     *
     * 
     */
    const {path, method, query, body} = data;
    let bodyData = body ? JSON.stringify(body) : null; // GET requests should have no body, POSTs do
    const options = this._makeOptions({path, method, query, bodyData});
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
      if(bodyData){
        req.write(bodyData);
      }
      req.end();
    });
  }
}
=======
const parseArgs = require('minimist')

const { simpleCheck, devStuff, sendToSlack } = require('./code/helpers');
const { MakeRequest } = require('./code/makeRequest');
>>>>>>> master

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
  try{
    let message = "unhandled webhook"
    if(argv['dev']){
      devStuff(req)
    }
    if( (req.body.type === "unsubscribe" || req.body.type === "profile") && simpleCheck(req)){   // check if it's an unsubscribe
      const patchBody = {};
      const bodyData = JSON.parse(req.body.data)
      console.log(`Request to unsubscribe ${bodyData.email}`)

      if(req.body.type === "unsubscribe"){
        patchBody = buildUnsubBody();
        message = `${req.body.data.email} unsubscribed`;
      } else if(req.body.type === "profile" ){
        
        const result = bodyData.merges.GROUPINGS .filter(group=> group.name == "Protocol Newsletters");
        if(result.length && result[0].groups && bodyData.email){
          patchBody = buildPathBody(result[0].groups)
          message = `Updating preferences for ${req.body.data.email}`;

        } else{
          sendToSlack(`Received profile update for ${bodyData.email} but 'groups' not found!`)
        }
      }

      // start process with zephr to update data
      const result = makeRequest.makePatchRequest(req.body.data.email, patchBody)

    }
    res.send(JSON.stringify({"result": message}));
  } catch(err){
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