// following this to install nvm and node on ec2 https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-up-node-on-ec2-instance.html
// curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
// . ~/.nvm/nvm.sh
// nvm install node 17.3.1
// node -e "console.log('Running Node.js ' + process.version)"
// ran `npm install` in my project folder


// todo:
// check for right list id

const express = require('express')
const dotenv = require('dotenv')
const parseArgs = require('minimist')

const { sendToSlack }= require('./code/helpers');
const postRoutes = require('./routes/post');
const headRoutes = require('./routes/head')

const argv = parseArgs(process.argv.slice(2), opts = { 'boolean': ['dev'] })

dotenv.config();

const app = express();
const port = argv['port'];


app.use(express.json());
app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies
app.use(postRoutes)
app.use(headRoutes)

app.listen(port, () => {
    try {
        console.log(`Listening at http://localhost:${port}`)
    } catch (err) {
        sendToSlack(err.stack)
    }
})