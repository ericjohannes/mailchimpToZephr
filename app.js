const express = require('express')
const dotenv = require('dotenv')
const CryptoJS = require("crypto-js");
const events = require('events');
const https = require('https')

let user_ids = new Set()
let inProgress = new Set()


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
    if(body  && Object.keys(body).length){
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
  
    const hmac = `ZEPHR-HMAC-SHA256 ${ this.accessKey}:${timestamp}:${nonce}:${hashString}`.replace(/\r?\n|\r/, "");
    return hmac
  }

  _makeOptions = ({path, method, query, body})=>{
    const authHeader = this._makeHash({path: path, method:method, query: query, body: body}); 
    let pathWithQuery = path;
    if(query){
      pathWithQuery += '?' + query;
    } 

    const options = Object.assign(this.baseOptions, {method: method, path: pathWithQuery});
    options.headers.Authorization = authHeader;
    return options
  }

  async makeEmailRequest(email){
    const emailQuery= `identifiers.email_address=${email}`
    const userPath = "/v3/users"
    // async function doSomethingUseful(parent) {
      // return the response
    const result =  await this._makeRequest({path: userPath, method:'GET', query: emailQuery, reqType: 'email'})
    console.log(result)

    // }
    // const result = doSomethingUseful(this)
    // console.log(result)
    return result


  }

  makeSecondRequest=(user_id) =>{
    const path = `/v3/users/${user_id}`;
    async function doSomethingUseful(parent) {
      // return the response
      return await parent._makeRequest({path: path, method:'GET', recType: 'userId'});
    }
    const result = doSomethingUseful(this)

    console.log(result)
  }

  _makeRequest = (data)=>{
    /* method should be GET, POST, PATCH etc.
     *  
     *
     * 
     */
    const {path, method, query, body, reqType} = data;
    const options = this._makeOptions({path, method, query, body});
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
        // res.on('data', d => {
        //   const data = JSON.parse(d)
        //   if(reqType == 'email'){
        //     user_ids.add(data.user_id)
        //     //Fire the 'newId' event:
        //     eventEmitter.emit('newId');
        //   } else if(reqType == 'userId'){
        //     // inProgress.delete()
        //     console.log('done', d)
        //   } else{
        //     console.log('unsupported recType')
        //   }
        // })        
      })
      req.on('error', (err) => {
        reject(err);
      });
      req.end();
    });
  }
}


dotenv.config();

const app = express()
const port = 3000


const makeRequest = new MakeRequest()

const eventEmitter = new events.EventEmitter();

//Create an event handler:
const newIdHandler = ()=>{
  console.log('new id');
  user_ids.forEach(id=>{
    inProgress.add(id)
    user_ids.delete(id)
    console.log(`id is ${id}`)
    makeRequest.makeSecondRequest(id)
  })
}

//Assign the event handler to an event:
eventEmitter.on('newId', newIdHandler);

app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.head('/', (req, res) => {

  // res.set('hello', 'world');
  console.log('head request')

});
app.post('/', (req, res) => {
  console.log(`POST request for ${req.body.email}`)
  // get email from req
  // const emailQuery= `identifiers.email_address=${req.body.email}`

  // send email to zephr to get user id
  const result = makeRequest.makeEmailRequest(req.body.email)
  // const emailResult = makeRequest.makeRequest({path: userPath, method:'GET', query: emailQuery})
  // console.log(emailResult)

  res.send('ok');
});

app.listen(port, () => {

  console.log(`Example app listening at http://localhost:${port}`)
})