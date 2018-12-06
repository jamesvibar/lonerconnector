const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const router = express.Router();

const Profile = require("../../models/Profile");
const User = require("../../models/User");

const validateProfileInput = require("../../validation/profile");
const validateExperienceInput = require("../../validation/experience");
const validateEducationInput = require("../../validation/education");

// // @route   GET api/profile/test
// // @desc    Tests profile route
// // @access  PUBLIC
router.get("/test", (req, res) => res.json({ msg: "Profile test" }));

// @route   GET api/profile
// @desc    Get the current users profile
// @access  PRIVATE
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const errors = {};

    Profile.findOne({ user: req.user.id })
      .populate("user", ["name", "avatar"])
      .then(profile => {
        if (!profile) {
          errors.noprofile = "There is no profile for this user";
          return res.status(404).json(errors);
        }
        res.json(profile);
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route   GET api/profile/all
// @desc    Get all profiles
// @access  PUBLIC

router.get("/all", (req, res) => {
  let errors = {};

  Profile.find()
    .populate("user", ["name", "avatar"])
    .then(profiles => {
      if (!profiles) {
        errors.noprofiles = "There are no profiles";
        return res.status(400).json(errors);
      }

      res.json(profiles);
    })
    .catch(err => res.status(400).json(err));
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile from user
// @access  PUBLIC
router.get("/user/:user_id", (req, res) => {
  let errors = {};

  Profile.findOne({ user: req.params.user_id })
    .populate("user", ["name", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.noprofile = "There is no profile for this user id";
        return res.status(404).json(errors);
      }

      res.json(profile);
    })
    .catch(err =>
      res.status(404).json({ noprofile: "There is no profile for this user" })
    );
});

// @route   GET api/profile/handle/:handle
// @desc    Get profile from handle
// @access  PUBLIC
router.get("/handle/:handle", (req, res) => {
  let errors = {};

  Profile.findOne({ handle: req.params.handle })
    .populate("user", ["name", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.noprofile = "There is no profile for this user";
        return res.status(404).json(errors);
      }
      return res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

// @route   POST api/profile
// @desc    Create or edit user profile
// @access  PRIVATE
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateProfileInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    // Get fields
    const profileFields = {};
    profileFields.user = req.user.id;

    if (req.body.handle) profileFields.handle = req.body.handle;
    if (req.body.company) profileFields.company = req.body.company;
    if (req.body.website) profileFields.website = req.body.website;
    if (req.body.location) profileFields.location = req.body.location;
    if (req.body.bio) profileFields.bio = req.body.bio;
    if (req.body.status) profileFields.status = req.body.status;
    if (req.body.githubusername)
      profileFields.githubusername = req.body.githubusername;
    // SKILLS - split into an array
    if (typeof req.body.skills !== "undefined") {
      profileFields.skills = req.body.skills.split(",");
    }
    // PROFILE
    profileFields.social = {};
    if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
    if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if (req.body.instagram) profileFields.social.instagram = req.body.instagram;

    Profile.findOne({ user: req.user.id })
      .then(profile => {
        if (profile) {
          // UPDATE PROFILE
          Profile.findOneAndUpdate(
            { user: req.user.id },
            { $set: profileFields },
            { new: true }
          ).then(profile => res.json(profile));
        } else {
          // CREATE PROFILE
          Profile.findOne({ handle: profileFields.handle })
            .then(profile => {
              if (profile) {
                errors.handle = "That handle already exists";
                return res.status(400).json(errors);
              }

              // Save profile
              new Profile(profileFields)
                .save()
                .then(profile => res.json(profile));
            })
            .catch(err => res.status(404).json(err));
        }
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route   POST api/profile/experience
// @desc    Add experience to profile
// @access  PRIVATE
router.post(
  "/experience",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateExperienceInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id })
      .then(profile => {
        const newExp = {
          title: req.body.title,
          company: req.body.company,
          location: req.body.location,
          from: req.body.from,
          to: req.body.to,
          current: req.body.current,
          description: req.body.description
        };

        // Add to experience array in profile
        profile.experience.unshift(newExp);

        profile.save().then(profile => res.json(profile));
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route   POST api/profile/education
// @desc    Add education to profile
// @access  PRIVATE
router.post(
  "/education",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateEducationInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id })
      .then(profile => {
        const newEducation = {
          school: req.body.school,
          degree: req.body.degree,
          fieldofstudy: req.body.fieldofstudy,
          description: req.body.description,
          from: req.body.from,
          to: req.body.to,
          current: req.body.current
        };

        profile.education.unshift(newEducation);

        profile.save().then(profile => res.json(profile));
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  PRIVATE
router.delete(
  "/experience/:exp_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        // Get remove index
        const removeIndex = profile.experience
          .map(item => item.id)
          .indexOf(req.params.exp_id);

        // Splice out of array
        profile.experience.splice(removeIndex, 1);

        profile.save().then(profile => res.json(profile));
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  PRIVATE
router.delete(
  "/education/:edu_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        // Get education current index
        const removeIndex = profile.education
          .map(item => item.id)
          .indexOf(req.params.edu_id);

        profile.education.splice(removeIndex, 1);

        profile.save().then(profile => res.json(profile));
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route   DELETE api/profile
// @desc    Delete user and profile
// @access  PRIVATE
router.delete(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOneAndRemove({ user: req.user.id }).then(() => {
      User.findOneAndRemove({ _id: req.user.id }).then(() =>
        res.json({ success: "true" })
      );
    });
  }
);

module.exports = router;
