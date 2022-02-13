const axios = require('axios')

function axiosTest() {
    axios
        .get('http://54.180.150.0:3000/api/questions')
        .then((response) => {
            console.log(response.data)
            $('#print').append(`<p>1</p>`)
        })
        .catch((error) => {
            console.error(error)
        })
}