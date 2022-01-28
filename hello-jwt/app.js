const jwt = require("jsonwebtoken");

const token = jwt.sign({ test: true }, 'my-secret-key');

console.log(token);

const decoded = jwt.verify(token, 'my-secret-key')

console.log(decoded)