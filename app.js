const express = require('express')
const dotenv = require('dotenv')
const CryptoJS = require("crypto-js");
const https = require('https')

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
      // hash.update(body)
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
    let bodyData = body ? JSON.stringify(body) : null
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

const app = express()
const port = 3000

const makeRequest = new MakeRequest()

app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/', (req, res) => {
  console.log(`POST request for ${req.body.email}`)

  // send email to zephr to get user id
  const result = makeRequest.makeEmailRequest(req.body.email)

  res.send('ok');
});

app.listen(port, () => {

  console.log(`Example app listening at http://localhost:${port}`)
})