const router = require("express").Router();
const { getUsers, register } = require("../controllers/");

router.get("/users", getUsers)
      .post("/auth/register", register);

module.exports = router;