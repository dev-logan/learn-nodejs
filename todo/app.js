const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Todo = require("./models/todo")

mongoose.connect("mongodb://localhost/todo-demo", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

const app = express();
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hi!");
});


//  할 일 가져오기
router.get("/todos", async (req, res) => {
    const todos = await Todo.find().sort("-order").exec();
    res.send({ todos });
});

//  할 일 입력하기
router.post("/todos", async (req, res) => {
    const { value } = req.body;
    const maxOrderTodo = await Todo.findOne().sort("-order").exec();
    let order = 1;

    if (maxOrderTodo) {
        order = maxOrderTodo.order + 1;
    }

    const todo = new Todo({ value, order })
    await todo.save();

    res.send({ todo })
});

//  할 일 순서, 내용, 완료 여부 변경하기
router.patch("/todos/:todoId", async (req, res) => {
    const { todoId } = req.params;
    const { order, value, done } = req.body;

    //  순서 변경
    const todo = await Todo.findById(todoId).exec();
    if (order) {
        const targetTodo = await Todo.findOne({ order }).exec();
        if (targetTodo) {
            targetTodo.order = todo.order;
            await targetTodo.save();
        }
        todo.order = order;
        await todo.save();
    }

    //  내용 변경
    if (value) {
        todo.value = value;
        await todo.save();
    }

    //  완료 여부 변경
    if (done) {
        todo.doneAt = new Date()
        await todo.save()
    } else {
        todo.doneAt = undefined
        await todo.save()
    }

    res.send({})
})

//  할 일 삭제하기
router.delete("/todos/:todoId", async (req, res) => {
    const { todoId } = req.params;
    await Todo.deleteOne({ _id: todoId });
    res.send({})
})


app.use("/api", bodyParser.json(), router);
app.use(express.static("./assets"));

app.listen(8080, () => {
  console.log("서버가 켜졌어요!");
});