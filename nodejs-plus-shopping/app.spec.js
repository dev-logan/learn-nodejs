const app = require('./app')
const supertest = require('supertest')  //  http 서버가 잘 작동하는지 확인
const { TestWatcher } = require('jest')

test('/index.html 경로에 요청했을 때 status code가 200이어야 한다.', async () => {
    const res = await supertest(app).get('/index.html')
    expect(res.status).toEqual(200)
})

test('/test.html 경로에 요청했을 때 status code가 404여야 한다.', async () => {
    const res = await supertest(app).get('/test.html')
    expect(res.status).toEqual(404)
})
