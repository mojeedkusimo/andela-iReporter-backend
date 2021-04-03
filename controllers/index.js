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
        let dateRegistered = await db.query('SELECT NOW()');
        let saltRound = 7;
        const hashedPassword = await bcrypt.hash(password, saltRound);
        const createUser = await db.query("INSERT INTO users (firstname, lastname, email, phone_number, password, isadmin, date_registered) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *", 
        [firstname, lastname, email, phoneNumber, hashedPassword, isadmin, dateRegistered.rows[0].now]);

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

let login = async (req, res, next) => {
    try {
        let { email, password } = req.body;

        let user = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        let userObj = user.rows[0];

        if ( !userObj ) {
            return res.json({
                status: 'error',
                data: {
                    message:'Invalid email'
                }
            })
        }

        let hashedPassword = await bcrypt.compare(password, userObj.password);
        
        if ( !hashedPassword ) {
            return res.json({
                status: 'error',
                data: {
                    message:'Incorrect password'
                }
            })
        }

        let { id, firstname, lastname, isadmin } = userObj;
        let userToken = { id, firstname, lastname, email, isadmin };
        let token = jwt.sign(userToken, SECRETE_KEY);

        return res.json({
            status: 'success',
            data: {
                token
            }
        })
    }
    catch (e) {
        return next(e);
    }
}

module.exports = {
    getUsers, register, login
};