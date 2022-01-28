const express = require('express')
const dotenv = require('dotenv')
const CryptoJS = require("crypto-js");
const events = require('events');
const https = require('https')

let user_ids = new Set()


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
  makeEmailRequest=(email)=>{
    const emailQuery= `identifiers.email_address=${email}`
    const userPath = "/v3/users"
    this._makeRequest({path: userPath, method:'GET', query: emailQuery})

  }
  makeSecondRequest=(user_id) =>{


  }
  _makeRequest = ({path, method, query, body})=>{
    /* method should be GET, POST, PATCH etc.
     *  
     *
     * 
     */
    const options = this._makeOptions({path, method, query, body})
    const req = https.request(options, res => {
      res.setEncoding('utf8');
      if(res.statusCode == 200){
        res.on('data', d => {
          // console.log(d)
          // if(doAnother){
          //   this._makeSecondRequest(d.user_id)
          // }
          // return d.user_id;
          const data = JSON.parse(d)
          user_ids.add(data.user_id)
          //Fire the 'newId' event:
          eventEmitter.emit('newId');

        })
      }
      else {
        console.log('could not retrieve data');
        // return false;
      }
    })
    req.on('error', (e) => {
      console.error(e);
    });
    req.end();
    }
}


dotenv.config();

const app = express()
const port = 3000


const makeRequest = new MakeRequest()

const eventEmitter = new events.EventEmitter();

//Create an event handler:
var newIdHandler = function () {
  console.log('new id');
  user_ids.forEach(id=>{
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