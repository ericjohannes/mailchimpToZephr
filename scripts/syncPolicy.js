// about 1k users signed up to policy via mailchimp and their zephr data was not synced
const Papa = require("papaparse");
const dotenv = require('dotenv');
const fs = require("fs");
const https = require("https");

const { buildPatchBody, policySyncWrapper }= require('../code/helpers');
const { MakeRequest } = require('../code/makeRequest');

const makeRequest = new MakeRequest();

// const fn = "./data/members_Policy_Email_Sub_Confirm_click_activity_Mar_7_2022.csv"
const fn = "./data/testPolicy.csv";
const failed_fn = "./data/failedToUpdataePolicy.txt";
// read in csv
const fileData = fs.readFileSync(fn, 'utf8', (err, data) => {
    if (err) {
        console.error(err)
        return null
    }
    return data
});

const recordFailure = (msg)=>{
    const data = `${msg}\n`
    // make a note of emails for accounts we fail to update
    fs.appendFile(failed_fn, data, 'utf8', (err)=> {
        if (err) throw err;
      }); 
}

const delay = ()=>{
    // was running into a rate limit from cloudflare
    // delay up to 1 minute: random 0.0 - 1.0 * milliseconds * seconds
    const time = Math.floor( Math.random() * 1000 * 60);
    return new Promise(resolve => setTimeout(resolve, time));
  }

const handleRow = async (row)=>{
    if(row.data["Protocol Newsletters"] && row.data["Protocol Newsletters"].includes('Policy')){
        const policySubBody = policySyncWrapper(row.data["Protocol Newsletters"])
        // update zephr
        await delay();
        const result = await makeRequest.makePatchRequest(row.data["Email Address"], policySubBody)

        if(result && result.message){
            console.log('success!')
        } else {
            recordFailure(`could not find in Zephr: ${row.data["Email Address"]}`)
        }
        
    }
}
// Stream big file in worker thread
Papa.parse(fileData, {
	worker: true,
    header: true,
	step: handleRow
});

// make patch request where Policy: true

