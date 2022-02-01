const express = require('express')
const Http = require('http')
const socketIo = require('socket.io')
// const mongoose = require("mongoose");
const jwt = require('jsonwebtoken')
const { User, Goods, Cart } = require('./models')
const { Op } = require('sequelize')
const authMiddleware = require('./middlewares/auth-middleware')
const Joi = require('joi')

// mongoose.connect("mongodb://localhost/shopping-demo", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// });
// const db = mongoose.connection;
// db.on("error", console.error.bind(console, "connection error:"));

const app = express()
const http = Http.createServer(app)
const io = socketIo(http)
const router = express.Router()

const socketIdMap = {}

function emitSamePageViewerCount() {
    console.log(Object.values(socketIdMap))
    const countByUrl = Object.values(socketIdMap).reduce((value, url) => {
        return {
            ...value,
            [url]: value[url] ? value[url] + 1 : 1,
        }
    }, {})

    for (const [socketId, url] of Object.entries(socketIdMap)) {
        const count = countByUrl[url]
        io.to(socketId).emit('SAME_PAGE_VIEWER_COUNT', count)
    }
}

io.on('connection', (socket) => {
    socketIdMap[socket.id] = null
    console.log('누군가 연결했어요!')

    socket.on('CHANGED_PAGE', (data) => {
        console.log('페이지가 바뀌었대요', data, socket.id)
        socketIdMap[socket.id] = data
        emitSamePageViewerCount()
    })

    socket.on('BUY', (data) => {
        const payload = {
            nickname: data.nickname,
            goodsId: data.goodsId,
            goodsName: data.goodsName,
            date: new Date().toISOString(),
        }
        console.log('클라이언트가 구매한 데이터', data, new Date())
        socket.broadcast.emit('BUY_GOODS', payload) //  io.emit: 모든 이에게 데이터를 보냄 / socket.broadcast.emit: 나를 제외한 모두에게
    })

    socket.on('disconnect', () => {
        delete socketIdMap[socket.id]
        console.log('누군가 연결을 끊었어요!')
        emitSamePageViewerCount()
    })
})

app.use(express.json())
app.use('/api', express.urlencoded({ extended: false }), router)
app.use(express.static('assets'))

// const schema = Joi.object({
//     nickname: Joi.string()
//         .alphanum()
//         .min(3)
//         .max(30)
//         .required(),

//     password: Joi.string()
//         .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),

//     confirmPassword: Joi.ref('password'),

//     email: Joi.string()
//         .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
// })
// .with('nickname', 'password', 'email', 'confirmPassword');

const postUsersSchema = Joi.object({
    nickname: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    confirmPassword: Joi.string().required(),
})

//  회원가입
router.post('/users', async (req, res) => {
    // const { value, error } = schema.validate(req.body)
    // if (error) {
    //     res.status(400).send({
    //         errorMessage: '입력 값을 확인해주세요.',
    //     });
    //     return;
    // }
    // const { nickname, password, confirmPassword, email } = value

    try {
        const { nickname, email, password, confirmPassword } =
            await postUsersSchema.validateAsync(req.body)

        if (password !== confirmPassword) {
            res.status(400).send({
                errorMessage: '패스워드가 패스워드 확인란과 동일하지 않습니다.',
            })
            return
        }

        //  email 또는 nickname이 일치하는 데이터가 있는지 검색
        const existUsers = await User.findAll({
            where: {
                [Op.or]: [{ email }, { nickname }],
            },
        })
        if (existUsers.length) {
            res.status(400).send({
                errorMessage: '이미 가입한 이메일 또는 닉네임이 있습니다.',
            })
            return
        }

        await User.create({ email, nickname, password })
        res.status(201).send({})
    } catch (error) {
        res.status(400).send({
            errorMessage: '요청한 데이터 형식이 올바르지 않습니다.',
        })
    }
})

//  로그인
router.post('/auth', async (req, res) => {
    const { email, password } = req.body

    const user = await User.findOne({
        where: {
            email,
        },
    })

    if (!user) {
        res.status(400).send({
            errorMessage: '이메일 또는 패스워드가 잘못되었습니다.',
        })
        return
    }

    const token = jwt.sign({ userId: user.userId }, 'my-secret-key')
    res.send({
        token,
    })
})

//  사용자 정보 - 미들웨어를 붙임
router.get('/users/me', authMiddleware, async (req, res) => {
    const { user } = res.locals //  로그인 한 유저의 정보
    res.send({
        user: {
            email: user.email,
            nickname: user.nickname,
        },
    })
})

// 상품 관련 내용

//  물품 조회
router.get('/goods', authMiddleware, async (req, res) => {
    const { category } = req.query

    const goods = await Goods.findAll(
        category ? { where: { category } } : undefined
    )
    res.json({
        goods,
    })
})

//  장바구니 목록 확인
router.get('/goods/cart', authMiddleware, async (req, res) => {
    const { userId } = res.locals.user
    const carts = await Cart.findAll({ where: { userId } })
    const goodsIds = carts.map((cart) => cart.goodsId)

    const goods = await Goods.findAll({ where: { goodsId: goodsIds } })

    res.json({
        cart: carts.map((cart) => ({
            quantity: cart.quantity,
            goods: goods.find((item) => item.goodsId === cart.goodsId),
        })),
    })
})

//  상품 상세 조회
router.get('/goods/:goodsId', authMiddleware, async (req, res) => {
    const { goodsId } = req.params

    const goods = await Goods.findOne({ where: { goodsId: Number(goodsId) } })

    res.json({
        goods,
    })
})

//  장바구니에 추가
router.post('/goods/:goodsId/cart', authMiddleware, async (req, res) => {
    const { userId } = res.locals.user
    const { goodsId } = req.params
    const { quantity } = req.body

    const existsCarts = await Cart.findAll({
        where: { userId, goodsId: Number(goodsId) },
    })
    if (existsCarts.length) {
        return res.status(400).json({
            success: false,
            errorMessage: '이미 장바구니에 들어있는 상품입니다.',
        })
    }

    await Cart.create({ userId, goodsId: Number(goodsId), quantity })
    res.json({ success: true })
})

//  장바구니에서 삭제
router.delete('/goods/:goodsId/cart', authMiddleware, async (req, res) => {
    const { userId } = res.locals.user
    const { goodsId } = req.params

    const existsCarts = await Cart.findAll({
        where: { userId, goodsId: Number(goodsId) },
    })
    if (existsCarts.length) {
        await Cart.destroy({ where: { userId, goodsId: Number(goodsId) } })
    }
    res.json({ success: true })
})

//  장바구니 상품 추가 및 수량 변경
router.put('/goods/:goodsId/cart', authMiddleware, async (req, res) => {
    const { userId } = res.locals.user
    const { goodsId } = req.params
    const { quantity } = req.body

    if (quantity < 1) {
        return res.status(400).json({
            success: false,
            errorMessage: '올바른 수량을 입력해주세요.',
        })
    }

    const existsCarts = await Cart.findAll({
        where: { userId, goodsId: Number(goodsId) },
    })
    if (!existsCarts.length) {
        await Cart.create({ userId, goodsId: Number(goodsId), quantity })
    } else {
        // await Cart.updateOne({ userId, goodsId: Number(goodsId) }, { $set: { quantity } })
        const cart = await Cart.findOne({
            where: { userId, goodsId: Number(goodsId) },
        })
        await cart.update({ quantity })
        await cart.save()
    }

    res.json({ success: true })
})

router.post('/goods', async (req, res) => {
    const { name, thumbnailUrl, category, price } = req.body

    // const goods = await Goods.findAll({ where: { goodsId } });
    // if (goods.length) {
    //     return res.status(400).json({ success: false, errorMessage: '이미 있는 데이터입니다.' })
    // }

    const createdGoods = await Goods.create({
        name,
        thumbnailUrl,
        category,
        price,
    })

    res.json({ createdGoods })
})

http.listen(8080, () => {
    console.log('서버가 요청을 받을 준비가 됐어요')
})
