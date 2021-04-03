const db = require("../db");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const SECRETE_KEY = process.env.SECRETE_KEY;

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

let register = async (req, res, next) => {
    try {
        const { firstname, lastname, email, phoneNumber, password, isadmin } = req.body;

        let saltRound = 7;
        const hashedPassword = await bcrypt.hash(password, saltRound);
        const createUser = await db.query("INSERT INTO users (firstname, lastname, email, phone_number, password, isadmin) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *", 
        [firstname, lastname, email, phoneNumber, hashedPassword, isadmin]);

        const userObj = createUser.rows[0];
        const { id } = userObj;

        const userToken = { id, firstname, lastname, email, phoneNumber, isadmin };

        const token = jwt.sign( userToken, SECRETE_KEY );
    
        return res.json({
            status: "success",
            data: {
                message: "User account successfully created",
                token,
            }
        })    
    }
    catch (e) {
        return next(e);
    }
}

module.exports = {
    getUsers, register
};