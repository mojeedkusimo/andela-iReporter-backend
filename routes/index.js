const router = require("express").Router();
const { getUsers, register, login, postReport, getAllReports, getReport } = require("../controllers");

router.get("/users", getUsers)
      .get("/all-reports", getAllReports)
      .get("/view-report/:id", getReport)
      .post("/auth/register", register)
      .post("/new-report", postReport)
      .post("/auth/login", login);

module.exports = router;