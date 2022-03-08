// about 1k users signed up to policy via mailchimp and their zephr data was not synced
const Papa = require("papaparse");
const dotenv = require('dotenv');
const fs = require("fs");
const https = require("https");

const fn = "./data/members_Policy_Email_Sub_Confirm_click_activity_Mar_7_2022.csv"
// read in csv
const fileData = fs.readFileSync(fn, 'utf8', (err, data) => {
    if (err) {
        console.error(err)
        return null
    }
    return data
});

// Stream big file in worker thread
Papa.parse(fileData, {
	worker: true,
    header: true,
	step: function(results) {
        // if Policy is in 'Protocol Newsletters'
        if(results.data["Protocol Newsletters"] && results.data["Protocol Newsletters"].includes('Policy')){
            console.log("Row:", results.data["Email Address"], results.data["Protocol Newsletters"]);

        }
	}
});

// make patch request where Policy: true

