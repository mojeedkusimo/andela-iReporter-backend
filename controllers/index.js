const db = require("../db");

let getUsers = async (req, res, next) => {
    try {
        const getUsersQuery = await db.query("SELECT * FROM users");
        const users = getUsersQuery.rows;
    
        return res.json({
            status: "success",
            message: users
        })    
    }
    catch (e) {
        return next(e);
    }
}

module.exports = {
    getUsers
};