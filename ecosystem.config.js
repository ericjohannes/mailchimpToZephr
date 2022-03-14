module.exports = {
  apps : [{
    name   : "mailchimpToZephr",
    script : "./app.js",
    watch: true,
    ignore_watch: ["data"],
    args: "--dev=true --port=443",
    error_file: ".logs/mailchimpToZephrErr.log",
    out_file: ".logs/mailchimpToZephrOut.log"
  }]
}
