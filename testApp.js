// having trouble knowing if mailchimp is connecting ok or if their is a bug in the app
// run this to see if we get anything

const express = require('express')

const app = express();
const port = 3000;
app.all("*", (req, res, next) => {
    console.log(req); // do anything you want here
    next();
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)

})