const express = require('express')
const app = express()
const port = 3000

app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
app.post('/', (req, res) => {
    console.log( req.body)
    res.send('ok');
});
app.head('/', (req, res) => {

  // res.set('hello', 'world');
  console.log('head request')

});
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})