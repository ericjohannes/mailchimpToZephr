const express = require('express')
const dotenv = require('dotenv')
const CryptoJS = require("crypto-js");

const https = require('https')


const makeHash = (path, body, method, queryString)=>{
  const accessKey = process.env.zephrAccessKey
  const secretKey = process.env.zephrSecretKey // "foobar"
  const timestamp = new Date().getTime().toString();
  const nonce = (Math.random()).toString();

  let hash = CryptoJS.algo.SHA256.create()
  hash.update(secretKey)
  if(body  && Object.keys(pm.request.body).length){
    hash.update(body)
    console.log('added boy')

  } else {
    console.log('no added body')
  }
  // console.log(pm.request.url.getQueryString());
  hashString = hash.update(path)
      .update(queryString)
      .update(method)
      .update(timestamp)
      .update(nonce)
      .finalize()
      .toString()

  const hmac = `ZEPHR-HMAC-SHA256 ${accessKey}:${timestamp}:${nonce}:${hashString}`.replace(/\r?\n|\r/, "");
  // console.log('accessKey', accessKey);
  // console.log('secretKey', secretKey);
  // console.log('path', path);
  // console.log('none', nonce);
  // console.log('timestamp', timestamp);
  // console.log('body',body);
  // console.log('method', method)
  // console.log('queryString', queryString)
  // console.log('hashString', hashString)
  // console.log('hmac', hmac)
  return hmac
}

dotenv.config();

const app = express()
const port = 3000

const baseUrl = "https://protocol.api.zephr.com/"
const userPath = "/v3/users"
const emailUrl = "https://protocol.api.zephr.com/v3/users/?identifiers.email_address=clintperalta@gmail.com"
const emailQueryKey = "identifiers.email_address"

app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.head('/', (req, res) => {

  // res.set('hello', 'world');
  console.log('head request')

});
app.post('/', (req, res) => {
  // console.log( req.body)
  // get email from req
  console.log('email', req.body.email)
  const subscriberEmail = req.body.email

  // send email to zephr to get user id

  // use user id to set all subscriptions to false

  res.send('ok');
});

app.listen(port, () => {

  const authHeader = makeHash(userPath, null, 'GET', "identifiers.email_address=eric.j.blom@gmail.com")
  console.log('authHeader', authHeader)
  
  const options = {
    headers: {
      'Authorization' : authHeader,
    },
    hostname: "protocol.api.zephr.com",
    path: userPath,
    method: 'GET',
    query: {
      'identifiers.email_address': 'eric.j.blom@gmail.com'
    },
    
  }
  
  const req = https.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`)
    console.log('url', req.url)
    console.log('during headers', JSON.stringify(req.headers));

    res.on('data', d => {
      console.log(d)
      console.log('on headers', JSON.stringify(req.headers));

    })
  })
  req.on('error', (e) => {
    console.error(e);
    console.log('err headers', JSON.stringify(req.headers));

  });
  console.log('after headers', req.headers);
  // console.log(req)
  req.end();
  console.log(`Example app listening at http://localhost:${port}`)
})