const express = require("express");
const router = express.Router();

const StudentMenu = require("../modals/studentMenu");

// Browse menu page
// URL: /student/menu
router.get("/menu", async (req, res) => {
    try {
        const menuItems = await StudentMenu.find({ isAvailable: true });

        res.render("student/menu", { menuItems });
    } catch (err) {
        console.log(err);
        res.send("Error loading menu");
    }
});

// Cart page
// URL: /student/cart
router.get("/cart", (req, res) => {
    res.render("student/cart");
});

// Payment page
// URL: /student/payment
router.get("/payment", (req, res) => {
    res.render("student/payment");
});

// Success page
// URL: /student/success
router.get("/success", (req, res) => {
    res.render("student/success");
});

module.exports = router;