const dotenv = require('dotenv')
const CryptoJS = require("crypto-js");
const https = require('https')
const { sendToSlack } = require('./helpers');

class MakeRequest {
    constructor() {
        this.accessKey = process.env.zephrAccessKey;
        this.secretKey = process.env.zephrSecretKey;
        this.baseOptions = {
            headers: {
                'User-Agent': 'PostmanRuntime/7.29.0'
            },
            hostname: "protocol.api.zephr.com",
        }
    }

    _makeHash = ({ path, method, query, body }) => {
        const timestamp = new Date().getTime().toString();
        const nonce = (Math.random()).toString();

        let hash = CryptoJS.algo.SHA256.create()

        hash.update(this.secretKey)
        if (body && body.length) {
            hash.update(body)
        }
        hash.update(path)
        if (query) {
            hash.update(query)
        }
        hash.update(method)
        hash.update(timestamp)
        const hashString = hash.update(nonce)
            .finalize()
            .toString()

        const hmac = `ZEPHR-HMAC-SHA256 ${this.accessKey}:${timestamp}:${nonce}:${hashString}`.replace(/\r?\n|\r/, "");
        return hmac
    }

    _makeOptions = (data) => {
        const { path, method, query, bodyData } = data;
        const authHeader = this._makeHash({ path: path, method: method, query: query, body: bodyData });
        let pathWithQuery = path;
        if (query) {
            pathWithQuery += '?' + query;
        }

        const options = Object.assign(this.baseOptions, { method: method, path: pathWithQuery });
        options.headers.Authorization = authHeader;
        return options
    }

    makePatchRequest = async (email, patchBody) => {
        const emailQuery = `identifiers.email_address=${email}`
        var emailPath = "/v3/users"

        const result = await this._makeRequest({ path: emailPath, method: 'GET', query: emailQuery })
        if(result.user_id){
            const userPath = `/v3/users/${result.user_id}`;
            
            const patchPath = `/v3/users/${result.user_id}/attributes`
            const secondResult = await this._makeRequest({ path: patchPath, method: 'PATCH', body: patchBody });
            // const thirdResult = await this._makeRequest({ path: userPath, method: 'GET' });
            return secondResult
        } else{
            sendToSlack(f`No user found in Zephr with email ${email}`)
            return null
        }
    }
    makeEmailRequest = async (email) => {
        const emailQuery = `identifiers.email_address=${email}`
        var emailPath = "/v3/users"
        return await this._makeRequest({ path: emailPath, method: 'GET', query: emailQuery })
    }

    _makeRequest = (data) => {
        /* method should be GET, POST, PATCH etc.
         *  
         *
         * 
         */
        const { path, method, query, body } = data;
        let bodyData = body ? JSON.stringify(body) : null; // GET requests should have no body, POSTs do
        const options = this._makeOptions({ path, method, query, bodyData });
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
            if (bodyData) {
                req.write(bodyData);
            }
            req.end();
        });
    }
}

module.exports = { MakeRequest };