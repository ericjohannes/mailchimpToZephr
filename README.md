# What is this?
We had a problem: We have subsriber data in Mailchimp's system and also in Zephr. If a subsriber chnanged their preferences through our website, it would update in Zephr and Zephr would update Mailchimp. Data could not flow the other way, however. If a user changed their preferenes through a Mailchimp email or form, Mailchimp could not communicate the changes to Zephr.

That is the function of this app.

# How it works
This app runs on a server and creates a mini server that recieves requests from a [Mailchimp webhook](https://mailchimp.com/developer/marketing/guides/sync-audience-data-webhooks/). The app parses the data it recieves from Mailchimp and communicates with Zephr's [admin api](https://support.zephr.com/admin-api) to make the appropiate changes.

## Changes it handles
1. "Unsubscribe" actions from readers. They click "Unsubcribe from all Protocol newsletters" in an email from us. This app changes their Zephr data to show them unsubscribed from all. In Mailchimp this is an "unsubcribe" event.
2. Users click in an email to subscribe to a new newsletter. In Mailchimp this is a "profile" event. The app updates their Zephr data to show them subscribed to the new newsletter.


# Before use
You will need node installed on the machine you want to run it on. Clone this repo into a local directory, `cd` into it and run `npm install` to install dependencies.

You will also need a `.env` file at the top of this directory looking like this with the right keys in it. 

```
zephrAccessKey=<key>
zephrSecretKey=<key>
slackToken=<token>
listId=<id>
uniqueId=<id>
route=<random string>
```

Ask someone who has these things for the right values. Or to redo this, `listId` and `uniqueId` come from Mailchimp (look at the body data). You can create the Zephr keys with your own admin account. You can also create your own Slack app to get a Slack token. The route was ramdonly generated. You would have to update the urls in Mailchimp's webhook if you change it.

# To use
This is designed to run with [Node](https://nodejs.org/en/). The main app is `app.js`, but running it takes some command line arguments. 

Example: `node app.js --dev=false --port=443`

* `--dev` can be `true` or `false`. Making it `true` just makes the app save a local copy of the headers and body data of all requests it recieves.
* `--port` tells the server what port to use. We want to use https so generally use `443`.

We use [pm2](https://pm2.keymetrics.io/) to run it in production so it restarts automatically and does other nice thigns. `ecosystem.config.js` configures how pm2 runs the script.

The app outputs errors and messages about success to the channel `#mailchimp-zephr-app` in Protocol's slack.

# Other scripts
* `testApp.js` just logs all requests to it. Useful for testing server settings to make sure your port is open.
* `scripts/testListener.js` useful for testing requests to this app. Run like `node scripts/testListener.js --port=443 --type=unsubscribe --host=localhost`. `host` is the host to connect to. If the app is running on the same machine `localhost` works. it can be an ip address. `port` is the port to connect to at that host. `type` can be `unsubscribe` or `profile` to test the app's ability to handle each type of requst.
* `scripts/syncClimate.js` a one-off script. It takes a `.csv` of users who subscribed to the Climate newsletter through an email before this app was set up (so their data did not get updated in Zephr). This script updates their Zephr data.
* `scripts/syncPolicy.js` same but for Policy
