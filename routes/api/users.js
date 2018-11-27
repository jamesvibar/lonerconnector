const express = require("express");
const router = express.Router();

// @route   GET api/posts/users
// @desc    Tests users route
// @access  PUBLIC
router.get("/test", (req, res) => res.json({ msg: "User test" }));

module.exports = router;
