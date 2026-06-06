require("dotenv").config();
const express = require('express')
const mongoose = require('mongoose');
const path = require('path')
const http = require('http');
const { Server } = require('socket.io');


// Passport & sessions
const session = require("express-session");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const { MongoStore } = require("connect-mongo");
const initializePassport = require("./config/passport");
initializePassport(passport);

//routes 
const studentAuthRoutes = require("./routes/StudentAuth");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const seedMenuItems = require("./seed");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET || "canteen-passport-secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: "mongodb://127.0.0.1:27017/canteenApp",
        collectionName: "sessions"
    }),
    cookie: {
        httpOnly: true,
        maxAge: parseInt(process.env.SESSION_MAX_AGE || "86400000", 10), // 1 day
        secure: false
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Expose session variables and user details to all EJS templates
app.use((req, res, next) => {
    // Populate legacy session properties for EJS menu popup compatibility
    if (req.isAuthenticated() && req.user) {
        req.session.studentId = req.user._id;
        req.session.isStudent = true;
        req.session.studentName = req.user.name || "";
    }
    res.locals.session = req.session || {};
    res.locals.user = req.user || null;
    next();
});

app.use("/student-auth", studentAuthRoutes);
app.use("/api/auth", studentAuthRoutes);

// Make io available in routes 

app.set("io", io);

// Database connection (gracefully handled if not running locally)
mongoose.connect("mongodb://127.0.0.1:27017/canteenApp")
    .then(() => {
        console.log(" MongoDB connected successfully");
    })
    .catch((err) => {
        console.log(" MongoDB connection warning (you can still run the frontend):", err.message);
    });

/* Page Routes */

// Home page
app.get('/', (req, res) => {
    res.render('home');
});

// Authentication routes
app.get('/auth/studentLogin', (req, res) => {
    res.render('auth/studentLogin');
});

app.get('/auth/adminLogin', (req, res) => {
    res.render('auth/adminLogin');
});


const studentRoutes = require("./routes/studentRoutes");

app.use("/student", studentRoutes);


seedMenuItems(); // to seed the database, HARDCODED MENU....



// Student flow routes
// app.get('/student/menu', (req, res) => {
//     res.render('student/menu');
// });

// app.get('/student/cart', (req, res) => {
//     res.render('student/cart');
// });

// app.get('/student/payment', (req, res) => {
//     res.render('student/payment');
// });

// app.get('/student/success', (req, res) => {
//     res.render('student/success');
// });

// Admin flow routes
app.get('/admin/dashboard', (req, res) => {
    res.render('admin/dashboard');
});

app.get('/admin/orders', (req, res) => {
    // We render the EJS template directly
    res.render('admin/orders');
});

/* Socket connection for real-time order updates */
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});






const port = 3000;
server.listen(port, () => {
    console.log(` Canteen Express server running at http://localhost:${port}`);
});