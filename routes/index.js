const router = require("express").Router();
const { getUsers, register, login } = require("../controllers");

router.get("/users", getUsers)
      .post("/auth/register", register)
      .post("/auth/login", login);

module.exports = router;