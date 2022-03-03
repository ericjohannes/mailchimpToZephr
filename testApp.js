// having trouble knowing if mailchimp is connecting ok or if their is a bug in the app
// run this to see if we get anything
// runs with a command line argument --port for port to listen to

const express = require('express')

const parseArgs = require('minimist')
const argv = parseArgs(process.argv.slice(2))

const app = express();
const port = argv['port'];
app.all("*", (req, res, next) => {
    console.log(req); // do anything you want here
    next();
    res.send(200)
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)

})