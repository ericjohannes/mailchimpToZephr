// following this to install nvm and node on ec2 https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-up-node-on-ec2-instance.html
// curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
// . ~/.nvm/nvm.sh
// nvm install node 17.3.1
// node -e "console.log('Running Node.js ' + process.version)"
// ran `npm install` in my project folder

const express = require('express')
const dotenv = require('dotenv')
const CryptoJS = require("crypto-js");
const https = require('https')
const fs = require('fs')

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

  makeEmailRequest = async (email)=>{
    const emailQuery= `identifiers.email_address=${email}`
    var emailPath = "/v3/users"

    const result =  await this._makeRequest({path: emailPath, method:'GET', query: emailQuery})
    console.log('makeEmailRequest result', result)
    
    const userPath = `/v3/users/${result.user_id}`;
    const unsubAll = {
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
    const patchPath = `/v3/users/${result.user_id}/attributes`
    const secondResult = await this._makeRequest({path: patchPath, method:'PATCH', body: unsubAll});
    const thirdResult = await this._makeRequest({path: userPath, method:'GET' });
    console.log('thirdResult', thirdResult)
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


dotenv.config();

const app = express();
const port = __dirname.includes('eblom') ? 3000 : 80; // contains eblom it's dev

const makeRequest = new MakeRequest();

const devStuff = (req) =>{
  // for dev purposes...
  const timeStamp = + new Date();
  //const headers = JSON.stringify(req.headers);
  fs.writeFileSync(`./data/${timeStamp}_headers.json`, JSON.stringify(req.headers, null, 2) , 'utf-8');
  const fileBodyData = JSON.parse(req.body.data);
  fs.writeFileSync(`./data/${timeStamp}_fileBodyData.json`, JSON.stringify(fileBodyData, null, 2) , 'utf-8');
}
app.use(express.json());
app.use(express.urlencoded()); // to support URL-encoded bodies

app.get('/', (req, res) => {
  devStuff(req)

  res.sendFile(__dirname + '/index.html');
});

app.head('/', (req, res) => {
  devStuff(req)

  res.sendStatus(200);
})
app.post('/', (req, res) => {
  // TODO: authenticate the message
  
  devStuff(req)


  if(req.body.type === "unsubscribe"){   // check if it's an unsubscribe
    const bodyData = JSON.parse(req.body.data)
    console.log(`POST request for ${bodyData.email}`)

    // start process with zephr to unsubscribe them
    // const result = makeRequest.makeEmailRequest(req.body.email)
    res.sendStatus(200);

 }
});

app.listen(port, () => {

  console.log(`Example app listening at http://localhost:${port}`)
})