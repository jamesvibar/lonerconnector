const express = require("express");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");

const keys = require("../../config/keys");
const User = require("../../models/User");
const router = express.Router();

// Load input validation;
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");

// @route   GET api/users
// @desc    Tests users route
// @access  PUBLIC
router.get("/test", (req, res) => res.json({ msg: "User test" }));

// @route   GET api/users/register
// @desc    Register a user
// @access  PUBLIC
router.post("/register", (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);

  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      errors.email = "Email is already taken";
      return res.status(400).json(errors);
    } else {
      // Get avatar from gravatar
      const avatar = gravatar.url(req.body.email, {
        s: "200", // SIZE
        r: "pg", // RATING
        d: "mm" // DEFAULT
      });

      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        avatar // avatar: avatar
      });

      // Encrypt password string with bcryptjs
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          // Set password from newUser to hashed password
          newUser.password = hash;
          // Save newUser to MongoDB database;
          newUser
            .save()
            .then(user => res.json(user)) // Return the result to the browser.
            .catch(err => console.log(err));
        });
      });
    }
  });
});

// @route   GET api/users/login
// @desc    Login user | Return JWT token
// @access  PUBLIC
router.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // Validation
  const { errors, isValid } = validateLoginInput(req.body);

  if (!isValid) {
    return res.status(404).json(errors);
  }

  // Find the user in the database using the email.
  User.findOne({ email }).then(user => {
    // Check if user does not exist in the MongoDB database.
    if (!user) {
      errors.email = "This user does not exist";
      return res.status(404).json(errors);
    }

    // Check password to bcrypt hashed password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        // Login successful
        const payload = { id: user.id, name: user.name, avatar: user.avatar };
        // Sign login token
        jwt.sign(
          payload,
          keys.secretOrKey,
          { expiresIn: 3600 },
          (err, token) => {
            res.json({
              success: true,
              token: "Bearer " + token
            });
          }
        );
      } else {
        errors.password = "Incorrect password";
        res.status(400).json(errors);
      }
    });
  });
});

// @route   GET api/users/current
// @desc    Return current user
// @access  PRIVATE
router.get(
  "/current",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    });
  }
);
module.exports = router;
