const express = require('express')
const cors = require('cors')
const app = express()
const port = 3000

app.use(cors())

app.get('/cors_test', (req, res) => {
    res.send('Hi')
})

app.listen(port, () => {
    console.log('서버가 켜졌어요!')
})