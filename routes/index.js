const router = require("express").Router();
const { getUsers, register, login, postReport, getAllReports, getReport, deleteReport, editReport, getUserReports, postComment } = require("../controllers");

router.get("/users", getUsers)
      .get("/all-reports", getAllReports)
      .get("/view-report/:id", getReport)
      .get("/my-reports/:id", getUserReports)
      .patch("/view-report/:id", editReport)
      .post("/auth/register", register)
      .post("/new-report", postReport)
      .post("/new-comment", postComment)
      .post("/auth/login", login)
      .delete("/view-report/:id", deleteReport);

module.exports = router;