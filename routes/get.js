const express = require('express');
const router = express.Router();
const dotenv = require('dotenv')
const parseArgs = require('minimist')

const { devStuff, sendToSlack, userAgentCheck }= require('../code/helpers');
const argv = parseArgs(process.argv.slice(2), opts = { 'boolean': ['dev'] })

dotenv.config();
const route = `/${process.env.route}`;

// we will set up Mailchimp to connect to two urls, one for unsubs and one for profile changes
// as such, we need ot respond to head requests at both
router.get(route + 'unsubscribe', (req, res) => { // mailchimp sends a head request to test the endpoint
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

router.get(route + 'profile', (req, res) => { // mailchimp sends a head request to test the endpoint
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