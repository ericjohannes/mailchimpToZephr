// about 1k users signed up to policy via mailchimp and their zephr data was not synced
const Papa = require("papaparse");
const dotenv = require('dotenv');
const fs = require("fs");
const https = require("https");

const { buildPatchBody, policySyncWrapper }= require('./code/helpers');
const { MakeRequest } = require('./code/makeRequest');

const fn = "./data/members_Policy_Email_Sub_Confirm_click_activity_Mar_7_2022.csv"
// read in csv
const fileData = fs.readFileSync(fn, 'utf8', (err, data) => {
    if (err) {
        console.error(err)
        return null
    }
    return data
});


const handleRow = (row)=>{
    if(row.data["Protocol Newsletters"] && row.data["Protocol Newsletters"].includes('Policy')){
        const newsletters = buildPatchBody(row.data["Protocol Newsletters"])
        const policySub = policySyncWrapper(row.data["Protocol Newsletters"])
        console.log(row.data["Email Address"], newsletters, policySub);
    }
}
// Stream big file in worker thread
Papa.parse(fileData, {
	worker: true,
    header: true,
	step: handleRow
});

// make patch request where Policy: true

