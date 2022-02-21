const express = require("express");
const cors = require("cors");
const app = express();
const port = 4000;
const fs = require("fs");

app.use(cors());
app.use(express.json());

const users = require("./users.json");
const { sendStatus } = require("express/lib/response");
let mySessionStorage = {};

app.post("/api/signup", (req, res) => {
  if (!req.body.name || !req.body.password) return res.sendStatus(400);
  const userExists = users.some((user) => user.name === req.body.name);
  if (userExists) return res.sendStatus(409);
  const newUser = {
    name: req.body.name,
    password: req.body.password,
    todos: [],
  };
  users.push(newUser);
  fs.writeFileSync("users.json", JSON.stringify(users, null, 4));
  res.sendStatus(200);
});

app.post("/api/todo", (req, res) => {
  const sessionId = req.header("authorization");
  if (!sessionId) return res.sendStatus(401);
  const user = mySessionStorage[sessionId];
  if (!user) return res.sendStatus(401);
  if (!req.body.todo) return res.sendStatus(400);
  const todo = req.body.todo;
  user.todos.push(todo);
  fs.writeFileSync("users.json", JSON.stringify(users, null, 4));
  res.sendStatus(200);
});

app.get("/api/todo", (req, res) => {
  const sessionId = req.header("authorization");
  if (!sessionId) return res.sendStatus(401);
  const user = mySessionStorage[sessionId];
  if (!user) return res.sendStatus(401);
  res.json(user.todos);
});

app.post("/api/login", (req, res) => {
  const authorizationHeader = req.header("authorization");
  if (!authorizationHeader) return res.sendStatus(401);
  const username = authorizationHeader.split(":::")[0];
  const password = authorizationHeader.split(":::")[1];
  const user = users.find(
    (user) => user.name === username && user.password === password
  );
  if (!user) return res.sendStatus(401);
  const sessionId = Math.random().toString();
  mySessionStorage[sessionId] = user;
  setTimeout(() => {
    delete mySessionStorage[sessionId];
  }, 10 * 60 * 1000);

  res.json(sessionId);
});

app.delete("/api/logout", (req, res) => {
  const sessionId = req.header("authorization");
  if (!sessionId) return res.sendStatus(401);
  delete mySessionStorage[sessionId];
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
