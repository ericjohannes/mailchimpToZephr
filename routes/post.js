const express = require('express');
const router = express.Router();
const { isEmail } = require('validator');
const dotenv = require('dotenv')
const parseArgs = require('minimist')

const { simpleCheck, devStuff, sendToSlack, buildUnsubBody, buildPatchBody }= require('../code/helpers');
const { MakeRequest } = require('../code/makeRequest');

const argv = parseArgs(process.argv.slice(2), opts = { 'boolean': ['dev'] })
const makeRequest = new MakeRequest();
dotenv.config();
const route = `/${process.env.route}`;
const uniqueId = process.env.uniqueId;

router.post(route + 'unsubscribe', (req, res) => {
    try {       
        if (argv['dev']) { // save data to disk if in dev
            devStuff(req)
        }     
        let message = "unhandled webhook"
        if( req && req.body && req.body.type && typeof req.body.type == 'string'){
            message = message + ` of type ${req.body.type} to unsubscribe`
        }
        if(simpleCheck(req) && req.body.type === "unsubscribe" && isEmail(req.body.data.email)){ // check basic stuff and if it's unsub

            let patchBody = {};
            console.log(`Request to unsubscribe ${req.body.data.email}`)
            patchBody = buildUnsubBody();
            message = `${req.body.data.email} unsubscribed`;    
            // start process with zephr to update data
            const result = makeRequest.makePatchRequest(req.body.data.email, patchBody)
            res.json({ "result": message });
        } else{
            res.sendStatus(403)
        }
        sendToSlack(message)
    } catch (err) {
        res.sendStatus(500)
        sendToSlack(err.stack)
    }
});

router.post(route + 'profile', (req, res) => {
    try {
        if(simpleCheck(req) &&  req.body.type === "profile" && isEmail(req.body.data.email)){ // check basic stuff
            let message = "unhandled webhook"
            if (argv['dev']) {
                devStuff(req)
            }
            if( req && req.body && req.body.type && typeof req.body.type == 'string'){
                message = message + ` of type ${req.body.type} to profile`
            }
            let patchBody = {};
            const newsletters = req.body.data.merges.GROUPINGS.filter(group => group.unique_id == uniqueId); // unique_id is a hashed id specific to the protocol newsletters audience. It comes from .env
            if (newsletters.length && newsletters[0].groups && typeof newsletters[0].groups === 'string') {
                patchBody = buildPatchBody(newsletters[0].groups)
                message = `Updating preferences for ${req.body.data.email}`;
                // update data in zephr        
                const result = makeRequest.makePatchRequest(req.body.data.email, patchBody)

                res.json({ "result": message });
            } else {
                message = `Received profile update for ${req.body.data.email} but 'groups' not found!`
                res.sendStatus(403)
            }    
            sendToSlack(message)
        } 
        
    } catch (err) {
        res.sendStatus(500)
        sendToSlack(err.stack)
    }
});

module.exports = router;