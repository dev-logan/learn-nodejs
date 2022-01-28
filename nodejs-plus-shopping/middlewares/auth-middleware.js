const jwt = require("jsonwebtoken")
const User = require("../models/user")

module.exports = (req, res, next) => {
    const { authorization } = req.headers;
    const [tokenType, tokenValue] = authorization.split(' ')
    
    if (tokenType !== 'Bearer') {
        res.status(401).send({
            errorMessage: '로그인 후 사용하세요'
        });
        return;
    }

    try {
        const { userId } = jwt.verify(tokenValue, "my-secret-key");

        User.findById(userId).exec().then((user) => {
            res.locals.user = user; //  이 미들웨어를 사용하는 곳에서 사용할 수 있는 (express가 제공하는 안전한) 변수
            next();
        });
        
    } catch (error) {
        res.status(401).send({
            errorMessage: '로그인 후 사용하세요'
        });
        return;
    }
};