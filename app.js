const express = require('express')
const dotenv = require('dotenv')
const CryptoJS = require("crypto-js");

const https = require('https')

class MakeRequest {
  constructor(){
    this.accessKey = process.env.zephrAccessKey
    this.secretKey = process.env.zephrSecretKey 
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
  makeRequest = ({path, method, query, body})=>{
    /* method should be GET, POST, PATCH etc.
     *  
     *
     * 
     */
    // const authHeader = _makeHash({path: path, method:method, query: query, body: body}); 
    // let pathWithQuery = path;
    // if(query){
    //   pathWithQuery += '?' + emailQuery;
    // } 

    // const options = Object.assign(this.baseOptions, {method: method, path: pathWithQuery});
    // options.headers.Authorization = authHeader;
    const options = this._makeOptions({path, method, query, body})
    const req = https.request(options, res => {
      res.setEncoding('utf8');
      if(res.statusCode == 200){
        res.on('data', d => {
          console.log('d', d)
          return d;
        })
      }
      else {
        console.log('could not retrieve data');
        return false;
      }
    })
    req.on('error', (e) => {
      console.error(e);
    });
    req.end();
    }
}

// const makeRequest = (newOptions)=>{
//   /* method should be GET, POST, PATCH etc.
//    * newOptions should 
//    *
//    * 
//    */
//   const authHeader = hasher.makeHash({path: userPath, method:'GET', query: emailQuery}); 
//   const options = Object.assign(baseOptions, {method: 'GET', path: userPath + '?' + emailQuery});
//   emailOPtions.headers.Authorization = authHeader
//   const req = https.request(emailOPtions, res => {
//     res.setEncoding('utf8');

//     if(res.statusCode == 200){
//       res.on('data', d => {
//         return d

//       })
//     }
//     else {
//       console.log('could not retrieve data based on email')
//       return
//     }
//   })
// }
dotenv.config();

const app = express()
const port = 3000

const baseUrl = "https://protocol.api.zephr.com/"
const userPath = "/v3/users"
const emailUrl = "https://protocol.api.zephr.com/v3/users/?identifiers.email_address=clintperalta@gmail.com"

// const reqOptions = {
//   headers: {
//     'User-Agent': 'PostmanRuntime/7.29.0'
//   },
//   hostname: "protocol.api.zephr.com",  
// }

const makeRequest = new MakeRequest()
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
  const emailQuery= `identifiers.email_address=${req.body.email}`

  // send email to zephr to get user id
  const emailResult = makeRequest.makeRequest({path: userPath, method:'GET', query: emailQuery})
  console.log(emailResult)
  // let emailData = {};
  // const authHeader = hasher.makeHash({path: userPath, method:'GET', query: emailQuery}); 
  // const emailOPtions = Object.assign(reqOptions, {method: 'GET', path: userPath + '?' + emailQuery});
  // emailOPtions.headers.Authorization = authHeader
  // const emailReq = https.request(emailOPtions, emailRes => {
  //   emailRes.setEncoding('utf8');

  //   if(emailRes.statusCode == 200){
  //     emailRes.on('data', d => {
  //       emailData = d;
  //       console.log(d)

  //     })
  //   }
  //   else {
  //     console.log('could not retrieve data based on email')
  //   }
  // })
  // emailReq.on('error', (e) => {
  //   console.error(e);

  // });
  // emailReq.end();
  // use user id to set all subscriptions to false

  res.send('ok');
});

app.listen(port, () => {

  console.log(`Example app listening at http://localhost:${port}`)
})