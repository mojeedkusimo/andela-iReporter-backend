const db = require("../db");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const SECRETE_KEY = process.env.SECRETE_KEY;
const FULLNAME = process.env.FULLNAME;
const PHONE_NUMBER = process.env.PHONE_NUMBER;
const nodemailer = require("nodemailer");

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

let postReport = async (req, res, next) => {
    try {
        let { user_id, title, context, type, status } = req.body;

        let createdOn = await db.query('SELECT NOW()');
        let reportPost = await db.query('INSERT INTO reports (title, context, created_by, created_on, type, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [title, context, user_id, createdOn.rows[0].now, type, status]);

        return res.json({
            status: "success",
            data: {
                message: "Report successfully posted"
            }
        })
    }
    catch (e) {
        return next(e);
    }
}

let getAllReports = async (req, res, next) => {
    try {
        let allReports = await db.query("SELECT r.id, r.title, r.context, u.firstname, r.type, r.status, r.created_on FROM reports r join users u ON r.created_by = u.id order by r.created_on desc");
        let allReportsCount = await db.query("SELECT COUNT(*) FROM reports");
        let openCount = await db.query("SELECT COUNT(*) FROM reports WHERE status='open'");
        let underIvestigationCount = await db.query("SELECT COUNT(*) FROM reports WHERE status='under investigation'");
        let rejectedCount = await db.query("SELECT COUNT(*) FROM reports WHERE status='rejected'");
        let resolvedCount = await db.query("SELECT COUNT(*) FROM reports WHERE status='resolved'");
        // let redFlagCount = await db.query("SELECT COUNT(*) FROM reports WHERE type='resolved'");
        // let interventionCount = await db.query("SELECT COUNT(*) FROM reports WHERE status='resolved'");
    
        return res.json({
            status: "success",
            data: {
                message: [allReports.rows],
                count: {
                    allReports: allReportsCount.rows[0].count,
                    open: openCount.rows[0].count,
                    underInvestigation: underIvestigationCount.rows[0].count,
                    rejected: rejectedCount.rows[0].count,
                    resolved: resolvedCount.rows[0].count                    
                }
            }
        });
    }
    catch (e) {
        return next(e);
    }
}

let getReport = async (req, res, next) => {
    try {
        let report = await db.query("SELECT u.firstname, r.* FROM reports r join users u ON u.id = r.created_by WHERE r.id=$1", [req.params.id]);


        return res.json({
            status: "success",
            data: {
                message: report.rows[0]
            }
        });
    }
    catch (e) {
        return next(e);
    }
}

let deleteReport = async (req, res, next) => {
    try {
        let report = await db.query("DELETE FROM reports WHERE id=$1", [req.params.id]);

        return res.json({
            status: "success",
            data: {
                message: "Report successfully deleted"
            }
        });
    }
    catch (e) {
        return next(e);
    }
}

let editReport = async (req, res, next) => {
    try {
        let { title, context, status } = req.body;
        let createdOn = await db.query('SELECT NOW()');

        if (title !== undefined && context !== undefined) {
            await db.query("UPDATE reports SET title=$1, context=$2, created_on=$3 WHERE id=$4", [ title, context, createdOn.rows[0].now, req.params.id ]);
        } else {
            await db.query("UPDATE reports SET status=$1,created_on=$2 WHERE id=$3", [ status, createdOn.rows[0].now, req.params.id ]);

            let userInfo = await db.query("SELECT u.firstname, r.title, r.status FROM users u JOIN reports r ON u.id = r.created_by WHERE r.id=$1", [req.params.id]);
            let userObj = userInfo.rows[0];

            let transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 587,
                secure: false,
                auth: {
                    user: FULLNAME,
                    pass: PHONE_NUMBER
                },
              });
        
              let info = await transporter.sendMail({
                from: '"Mojeed Kusimo" <mkusimo90@gmail.com>',
                to: "mkusimo90@gmail.com",
                subject: "Status Update from iReporter",
                text: `Dear ${userObj.firstname},
                    This is to notify you that your report on ${userObj.title} has been updated to ${userObj.status}.
                    Thank you for using our platform, we shall keep you updated.

                    Best regards,
                    Mojeed A. Kusimo.
                `,
                html: `<h3>Dear ${userObj.firstname},</h3>
                <p>This is to notify you that your report on <b><i>${userObj.title}</i></b> has been updated to <b><i>${userObj.status}</i></b>.</p>
                <p>Thank you for using our platform, we shall keep you updated.</p>

                <p>Best regards,</p>
                <h3><b>Mojeed A. Kusimo.</b></h3>
                <h3><b>Developer, iReporter</b></h3>
                `,
              });
        }

        return res.json({
            status: "success",
            data: {
                message: "Report successfully updated"
            }
        });
    }
    catch (e) {
        return next(e);
    }
}

let getUserReports = async (req, res, next) => {
    try {
        let allReports = await db.query("SELECT r.id, r.title, r.context, u.firstname, r.type, r.status, r.created_on FROM reports r join users u ON r.created_by = u.id  WHERE r.created_by=$1 order by r.created_on desc", [req.params.id]);
        let allReportsCount = await db.query("SELECT COUNT(*) FROM reports WHERE created_by=$1", [req.params.id]);
        let openCount = await db.query("SELECT COUNT(*) FROM reports WHERE status='open' and created_by=$1", [req.params.id]);
        let underIvestigationCount = await db.query("SELECT COUNT(*) FROM reports WHERE status='under investigation' and created_by=$1", [req.params.id]);
        let rejectedCount = await db.query("SELECT COUNT(*) FROM reports WHERE status='rejected' and created_by=$1", [req.params.id]);
        let resolvedCount = await db.query("SELECT COUNT(*) FROM reports WHERE status='resolved' and created_by=$1", [req.params.id]);
    
        return res.json({
            status: "success",
            data: {
                message: [allReports.rows],
                count: {
                    allReports: allReportsCount.rows[0].count,
                    open: openCount.rows[0].count,
                    underInvestigation: underIvestigationCount.rows[0].count,
                    rejected: rejectedCount.rows[0].count,
                    resolved: resolvedCount.rows[0].count                    
                }
            }
        });
    }
    catch (e) {
        return next(e);
    }
}


module.exports = {
    getUsers, register, login, postReport, getAllReports, getReport, deleteReport, editReport, getUserReports
};