const accessKey = pm.variables.get('zephrAccessKey')
const secretKey = pm.variables.get('zephrSecretKey')
console.log(accessKey);
console.log(secretKey);

// expanding variables in URL with pm.variables.replaceIn, then constructing path
const path = `/${pm.variables.replaceIn(pm.request.url.path).join('/')}`
console.log(pm.variables);
const timestamp = new Date().getTime().toString();
const nonce = (Math.random()).toString();

let hash = CryptoJS.algo.SHA256.create()
hash.update(secretKey)

if (pm.request.body && Object.keys(pm.request.body).length) {
    // expanding variables in body before updating hash with payload
    hash.update(pm.variables.replaceIn(pm.request.body.raw))
}
console.log(pm.request.url.getQueryString());
hashString = hash.update(path)
    .update(pm.request.url.getQueryString())
    .update(request.method)
    .update(timestamp)
    .update(nonce)
    .finalize()
    .toString()

const hmac = `ZEPHR-HMAC-SHA256 ${accessKey}:${timestamp}:${nonce}:${hashString}`.replace(/\r?\n|\r/, "");
pm.environment.set('zephrAuthHeader', hmac);