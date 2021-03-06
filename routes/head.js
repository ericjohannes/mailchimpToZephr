const express = require('express');
const router = express.Router();
const dotenv = require('dotenv')
const parseArgs = require('minimist')

const { devStuff, sendToSlack, userAgentCheck }= require('../code/helpers');
const argv = parseArgs(process.argv.slice(2), opts = { 'boolean': ['dev'] })

dotenv.config();
const route = `/${process.env.route}`;

// mailchimps docs say they send a head request to check new webhook urls, so I wrote this
// but it seems like they actually send get requests for that
// so this might be superfluous

router.head(route + 'unsubscribe', (req, res) => { 
    if (argv['dev']) {
        devStuff(req)
    }
    try {
        if(userAgentCheck(req)){
            if (argv['dev']) {
                devStuff(req)
            }
            res.sendStatus(200);
        } else {
            res.sendStatus(403)
        }
        
    } catch (err) {
        res.sendStatus(500)
        sendToSlack(err.stack)
    }
});

router.head(route + 'profile', (req, res) => { // mailchimp sends a head request to test the endpoint
    try {
        if(userAgentCheck(req)){
            if (argv['dev']) {
                devStuff(req)
            }
            res.sendStatus(200);
        } else {
            res.sendStatus(403)
        }
        
    } catch (err) {
        res.sendStatus(500)
        sendToSlack(err.stack)
    }
});
module.exports = router;