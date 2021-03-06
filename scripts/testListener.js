// runs with command line arguments --port for port to connect to, --host for hostname to connect to, --type for type of webhook to send, 'profile' or 'unsubscribe'
// use like `node testListener.js --port=3000 --host=localhost`

const https = require('https')

const parseArgs = require('minimist')
const argv = parseArgs(process.argv.slice(2))


const dotenv = require('dotenv');
dotenv.config();

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

const bodyData = {
    'unsubscribe': JSON.stringify({
        'type': 'unsubscribe',
        'fired_at': '2022-02-09 07:48:35',
        'data': { "action": "unsub", "reason": "manual", "id": "9e27254646", "email": "eric.j.blom@gmail.com", "email_type": "html", "ip_opt": "34.194.216.113", "web_id": "188435138", "campaign_id": "4687c4dbe4", "merges": { "EMAIL": "eric.j.blom@gmail.com", "FNAME": "", "LNAME": "", "ADDRESS": "", "PHONE": "", "MMERGE5": "", "JOBTITLE": "", "COMPANY": "", "MMERGE8": "", "MMERGE9": "", "RH_CODE": "7f9e6132", "RH_REFLINK": "https://sparklp.co/7f9e6132", "RH_SUBID": "sub_1cfae58002", "RH_ISREF": "NO", "RH_TOTREF": "0", "RH_LASTREF": "", "RH_SHARER": "NO", "RH_LASTREW": "", "RH_GLOBREF": "", "RH_COUPON": "", "SIGNUP": "", "SOURCECODE": "true", "GAMING": "", "WORKPLACE": "true", "BRAINTRUST": "true", "ENTERPRISE": "true", "CHINA": "true", "POLICY": "true", "PIPELINE": "true", "ENTERTAINM": "true", "ALERTS": "false", "FINTECH": "true", "CLIMATE": "", "INTERESTS": "Source Code, Cloud, Pipeline, Braintrust, Entertainment, FinTech, China, Policy, Workplace", "GROUPINGS": [{ "id": "6554", "unique_id": "d08cebb0bc", "name": "Protocol Newsletters", "groups": "Source Code, Cloud, Pipeline, Braintrust, Entertainment, FinTech, China, Policy, Workplace" }, { "id": "6558", "unique_id": "90d532c509", "name": "From RebelMouse", "groups": "" }] }, "list_id": "cd425f6479" }
    }),
    'profile': JSON.stringify({
        'type': 'profile',
        'fired_at': '2022-02-09 07:48:35',
        'data': { "id": "89df22ccbf", "email": "eric.j.blom@gmail.com", "email_type": "html", "ip_opt": "3.85.228.30", "web_id": "188451890", "merges": { "EMAIL": "eric.j.blom@gmail.com", "FNAME": "", "LNAME": "", "ADDRESS": "", "PHONE": "", "MMERGE5": "N/A", "JOBTITLE": "", "COMPANY": "", "MMERGE8": "", "MMERGE9": "", "RH_CODE": "012969d3", "RH_REFLINK": "https://sparklp.co/012969d3", "RH_SUBID": "sub_105ff62b6f", "RH_ISREF": "YES", "RH_TOTREF": "0", "RH_LASTREF": "", "RH_SHARER": "NO", "RH_LASTREW": "", "RH_GLOBREF": "", "RH_COUPON": "", "SIGNUP": "", "SOURCECODE": "true", "GAMING": "", "WORKPLACE": "true", "BRAINTRUST": "true", "ENTERPRISE": "true", "CHINA": "true", "POLICY": "false", "PIPELINE": "true", "ENTERTAINM": "true", "ALERTS": "true", "FINTECH": "true", "CLIMATE": "true", "INTERESTS": "Source Code, Cloud, Pipeline, Protocol Alerts, Braintrust, Entertainment, FinTech, China, Workplace, Climate", "GROUPINGS": [{ "id": "6554", "unique_id": "d08cebb0bc", "name": "Protocol Newsletters", "groups": "Source Code, Cloud, Pipeline, Protocol Alerts, Braintrust, Entertainment, FinTech, China, Workplace, Climate" }, { "id": "6558", "unique_id": "90d532c509", "name": "From RebelMouse", "groups": "" }] }, "list_id": "cd425f6479" }
    })
};

const options = {
    headers: {
        'User-Agent': 'MailChimpToZephr Test',
        'Content-Type': 'application/json',
    },
    hostname: argv['host'],// 52.44.53.181 or localhost
    port: argv['port'],
    method: 'POST',
    path: `/${process.env.route}${argv['type']}`,
}

const req = https.request(options, res => {
    res.setEncoding('utf8');
    let responseBody = '';

    res.on('data', (chunk) => {
        responseBody += chunk;
    });
    res.on('end', () => {
        console.log(JSON.parse(responseBody));
    });
})
req.on('error', (err) => {
    console.log('err', (err));
});
req.write(bodyData[argv['type']]);
req.end();