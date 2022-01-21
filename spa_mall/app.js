const express = require('express')
const app = express()
const port = 3000

const goodsRouter = require('./routes/goods')

// 미들웨어
const requestMiddleware = (req, res, next) => {
    console.log('Request URL:', req.originalUrl, ' - ', new Date())
    next()
}

app.use(requestMiddleware)

app.use('/api', goodsRouter)


// request, respond
app.get('/', (req, res) => {
    res.send('Hello World')
})


// 서버 켜기
app.listen(port, () => {
    console.log(port, '포트로 서버가 켜졌어요!')
})