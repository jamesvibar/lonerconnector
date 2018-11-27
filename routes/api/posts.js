const express = require("express");
const router = express.Router();

// @route   GET api/posts/test
// @desc    Tests post route
// @access  PUBLIC
router.get("/test", (req, res) => res.json({ msg: "Posts test" }));

module.exports = router;
