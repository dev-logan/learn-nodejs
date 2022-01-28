const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("./models/user");
const authMiddleware = require("./middlewares/auth-middleware")
const Joi = require('joi');

mongoose.connect("mongodb://localhost/shopping-demo", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

const app = express();
const router = express.Router();


const schema = Joi.object({
    nickname: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required(),

    password: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),

    confirmPassword: Joi.ref('password'),

    email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
})
    // .with('nickname', 'password', 'email', 'confirmPassword');


//  회원가입
router.post("/users", async (req, res) => {
    const { value, error } = schema.validate(req.body)
    if (error) {
        res.status(400).send({
            errorMessage: '입력 값을 확인해주세요.',
        });
        return;
    }
    const { nickname, password, confirmPassword, email } = value

    // if (password !== confirmPassword) {
    //     res.status(400).send({
    //         errorMessage: '패스워드가 패스워드 확인란과 동일하지 않습니다.',
    //     });
    //     return;
    // }

    const existUsers = await User.find({
        $or: [{ email }, { nickname }], //  email 또는 nickname이 일치하는 데이터가 있는지 검색
    })
    if (existUsers.length) {
        res.status(400).send({
            errorMessage: '이미 가입한 이메일 또는 닉네임이 있습니다.',
        });
        return;
    }

    const user = new User({ email, nickname, password });
    await user.save();

    res.status(201).send({});
})



//  로그인
router.post("/auth", async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email, password });

    if (!user) {
        res.status(400).send({
            errorMessage: '이메일 또는 패스워드가 잘못되었습니다.'
        })
        return;
    }

    const token = jwt.sign({ userId: user.userId }, "my-secret-key")
    res.send({
        token,
    })
})



//  사용자 인증 - 미들웨어를 붙임
router.get("/users/me", authMiddleware, async (req, res) => {
    const { user } = res.locals;    //  로그인 한 유저의 정보
    res.send({
        user: {
            email: user.email,
            nickname: user.nickname,
        },
    });
})



app.use("/api", express.urlencoded({ extended: false }), router);
app.use(express.static("assets"));

app.listen(8080, () => {
    console.log("서버가 요청을 받을 준비가 됐어요");
});