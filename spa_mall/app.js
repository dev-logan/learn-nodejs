const express = require('express')
const connect = require('./schemas')
const app = express()
const port = 3000

connect()

const goodsRouter = require('./routes/goods')

// 미들웨어
const requestMiddleware = (req, res, next) => {
    console.log('Request URL:', req.originalUrl, ' - ', new Date())
    next()
}

app.use(express.static('static'))
app.use(express.json())
app.use(express.urlencoded())   //  프론트엔드는 JSON 데이터가 아닌 URL Encoded 형식의 데이터로 Body를 보낸다고 함
app.use(requestMiddleware)

app.use('/api', [goodsRouter])


// request, respond
app.get('/', (req, res) => {
    res.send('Hello World')
})


// 서버 켜기
app.listen(port, () => {
    console.log(port, '포트로 서버가 켜졌어요!')
})