const mongoose = require('mongoose')

const goodsSchema = new mongoose.Schema({
    goodsId: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    thumbnailUrl: {
        type: String
    },
    category: {
        type: String
    },
    price: {
        type: Number
    }
})

module.exports = mongoose.model('Goods', goodsSchema)   //  mongoose가 collection 이름을 자동으로 만들어 주는 것 같다