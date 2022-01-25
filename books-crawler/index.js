const axios = require("axios");
const iconv = require("iconv-lite");
const cheerio = require("cheerio");

//  html을 가져옴
axios({
    url: "http://www.yes24.com/24/Category/BestSeller",
    method: "GET",
    responseType: "arraybuffer"
})
    .then((response) => {                       //  오래된 한국 사이트에서 쓰이고 있는 인코딩
        const content = iconv.decode(response.data, "EUC-KR").toString(); //  buffer 형태의 데이터를 해독, 한글 깨지는 현상을 고침
        const $ = cheerio.load(content);
        $("#bestList > ol > li").each((index, element) => {
            const title = $(element).find("p:nth-child(3) > a").text();
            const description = $(element).find("p.copy > a").text();
            const price = $(element).find("p.price > strong").text();
            const imageUrl = $(element).find("p.image > a > img").attr('src');

            console.log(index + 1, {
                title,
                description,
                price,
                imageUrl
            });
        })
    })
    .catch((error) => {
        console.error(error);
    });