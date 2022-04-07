# What is this?
We had a problem: We have subsriber data in Mailchimp's system and also in Zephr. If a subsriber chnanged their preferences through our website, it would update in Zephr and Zephr would update Mailchimp. Data could not flow the other way, however. If a user changed their preferenes through a Mailchimp email or form, Mailchimp could not communicate the changes to Zephr.

That is the function of this app.

# How it works
This app runs on a server and creates a mini server that recieves requests from a [Mailchimp webhook](https://mailchimp.com/developer/marketing/guides/sync-audience-data-webhooks/). The app parses the data it recieves from Mailchimp and communicates with Zephr's [admin api](https://support.zephr.com/admin-api) to make the appropiate changes.

## Changes it handles
1. "Unsubscribe" actions from readers. They click "Unsubcribe from all Protocol newsletters" in an email from us. This app changes their Zephr data to show them unsubscribed from all. In Mailchimp this is an "unsubcribe" event.
2. Users click in an email to subscribe to a new newsletter. In Mailchimp this is a "profile" event. The app updates their Zephr data to show them subscribed to the new newsletter.


# Before use
1. You will need node installed on the machine you want to run it on. Clone this repo into a local directory, `cd` into it and run `npm install` to install dependencies.
2. You will also need a `.env` file at the top of this directory looking like this with the right keys in it. 

```
zephrAccessKey=<key>
zephrSecretKey=<key>
slackToken=<token>
listId=<id>
uniqueId=<id>
route=<random string>
```

Ask someone who has these things for the right values. Or to redo this, `listId` and `uniqueId` come from Mailchimp (look at the body data). You can create the Zephr keys with your own admin account. You can also create your own Slack app to get a Slack token. The route was ramdonly generated. You would have to update the urls in Mailchimp's webhook if you change it.
3. You will need `cert.pem` and `key.pem` in the `certs/` directory. [Steps to make those here](https://nodejs.org/en/knowledge/HTTP/servers/how-to-create-a-HTTPS-server/).

# To use
This is designed to run with [Node](https://nodejs.org/en/). The main app is `app.js`, but running it takes some command line arguments. 

Example: `node app.js --dev=false --port=443`

* `--dev` can be `true` or `false`. Making it `true` just makes the app save a local copy of the headers and body data of all requests it recieves.
* `--port` tells the server what port to use. We want to use https so generally use `443`.

We use [pm2](https://pm2.keymetrics.io/) to run it in production so it restarts automatically and does other nice thigns. `ecosystem.config.js` configures how pm2 runs the script.

Run all apps in that config file (so far just app.js) with `pm2 start ecosystem.config.js`

The app outputs errors and messages about success to the channel `#mailchimp-zephr-app` in Protocol's slack.

# Set up Mailchimp
You will need to tell Mailchimp to talk to this app. To do so, create two webhooks. 
1. Set one for "profile" changes and for the url use `<ip of server app is on><route from .env>profile`.
2. Set second for "unsubsribe" events and for the url use `<ip of server app is on><route from .env>unsubscribe`.

[See here](https://mailchimp.com/developer/marketing/guides/sync-audience-data-webhooks/) for more info on Mailchimp webhooks. 

# Other scripts
* `testApp.js` just logs all requests to it. Useful for testing server settings to make sure your port is open.
* `scripts/testListener.js` useful for testing requests to this app. Run like `node scripts/testListener.js --port=443 --type=unsubscribe --host=localhost`. `host` is the host to connect to. If the app is running on the same machine `localhost` works. it can be an ip address. `port` is the port to connect to at that host. `type` can be `unsubscribe` or `profile` to test the app's ability to handle each type of requst.
* `scripts/syncClimate.js` a one-off script. It takes a `.csv` of users who subscribed to the Climate newsletter through an email before this app was set up (so their data did not get updated in Zephr). This script updates their Zephr data.
* `scripts/syncPolicy.js` same but for Policy
* `scripts/testSlack.js` was just for testing the Slack integration

## How to use a sync script
As a warning, these scripts are not set up to be reused, and they only run on the command lin. You will likely have to write some code and run some code.

If you are "syncing" data from one of the newsletters already handled (Climate and Policy) you will likely only have to chnage the name of the .csv file in the `fn` variable at the top of script. Just copy your new csv and paste it in there.

If you are syncing data for a new newsletter, you will probably want to copy `syncClimate.js` or `syncPolicy.js`. They change the value of `fn` to your new csv and change all referecnes to `climate`, `Cliamte`, or `policy` etc. in the script to whatever your new newsletter is. If you do it right  it *should* work, but it's hard to guarantee without testing with your new data.

Either way, now you have a `sync....js` script ready to run. Now you need to run it. You'll do so from the command line.
1. you'll need [node](https://nodejs.org/en/), which is software that executes javascript on your computer. Download it through your browser or if you have [homebrew](https://brew.sh/) `brew install node`. 
2. make sure your .csv file (that you referenced with `fn` in the sync script is) in the `/data` folder of this project on your machine.
3. open your terminal. Use `cd` to navigate into the root folder of this project. Make sure you install all dependencies with `npm install`. [Help with the terminal](https://support.apple.com/guide/terminal/welcome/mac)
4. run your script like `node scripts/<your script>.js`. For example, for the Policy script it's `node scripts/syncPolicy.js`

It is always good to test. AN easy way to do that is to go to your new csv, copy the first line (iwth the headers) and the second line (first line with data) and paste into a new csv, call it something like `test.csv`. In the csv, replace the email with the email of a test account, like your own. Replace the `fn` with that name in your script. If you replaced the email with your own in all cases and in taht test file, and if you point the sync script to that test file, it should only affect the test account. now run the script as described above and see if changes you expect are made to that test account.