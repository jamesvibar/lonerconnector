const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const router = express.Router();

const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const validatePostInput = require("../../validation/post");

// @route   GET api/posts/test
// @desc    Tests post route
// @access  PUBLIC
router.get("/test", (req, res) => res.json({ msg: "Posts test" }));

// @route   GET api/posts
// @desc    Get posts
// @access  Public
router.get("/", (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json({ nopostfound: "No posts found" }));
});

// @route   GET api/posts/:post_id
// @desc    Get posts by id
// @access  Public
router.get("/:post_id", (req, res) => {
  Post.findById(req.params.post_id)
    .then(post => {
      res.json(post);
    })
    .catch(err =>
      res.status(404).json({ nopostfound: "No post with that ID" })
    );
});

// @route   POST api/posts
// @desc    Create post
// @access  PRIVATE
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    });

    newPost.save().then(post => res.json(post));
  }
);

// @route   DELETE api/posts/:post_id
// @desc    Delete post by id
// @access  Private
router.delete(
  "/:post_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.body.id }).then(profile => {
      Post.findById(req.params.post_id)
        .then(post => {
          // Check for post owner
          if (post.user.toString() !== req.user.id) {
            return res
              .status(401)
              .json({ notauthorized: "User not authorized" });
          }

          //Delete
          post.remove().then(() => res.json({ success: true }));
        })
        .catch(err =>
          res.status(404).json({ postnotfound: "No post found with this ID" })
        );
    });
  }
);

// @route   POST api/posts/like/:id
// @desc    Like post
// @access  Private
router.post(
  "/like/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.body.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length > 0
          ) {
            return res
              .status(400)
              .json({ alreadyliked: "User already liked this post" });
          }

          // Add user id to likes array
          post.likes.unshift({ user: req.user.id });

          post.save().then(post => res.json(post));
        })
        .catch(err =>
          res.status(404).json({ postnotfount: "No post found with this ID" })
        );
    });
  }
);

// @route   POST api/posts/unlike/:id
// @desc    Unlike post
// @access  Private
router.post(
  "/unlike/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.body.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length === 0
          ) {
            return res
              .status(400)
              .json({ alreadyliked: "You have not yet liked this post" });
          }

          // Get remove index
          const removeIndex = post.likes
            .map(item => item.user.toString())
            .indexOf(req.user.id);

          // Splice out of array
          post.likes.splice(removeIndex, 1);

          post.save().then(post => res.json(post));
        })
        .catch(err =>
          res.status(404).json({ postnotfound: "No post found with this ID" })
        );
    });
  }
);

// @route   POST api/posts/comment/:id
// @desc    Add comment to a post
// @access  PRIVATE
router.post(
  "/comment/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    Post.findById(req.params.id)
      .then(post => {
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id
        };

        // Adds to comments array
        post.comments.unshift(newComment);

        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnotfound: "No post found" }));
  }
);

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete comment from post
// @access  PRIVATE
router.delete(
  "/comment/:id/:comment_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Post.findById(req.params.id)
      .then(post => {
        // Check to see if comment exists
        if (
          post.comments.filter(
            comment => comment._id.toString() === req.params.comment_id
          ).length === 0
        ) {
          return res
            .status(404)
            .json({ commentnotexists: "Comment does not exist." });
        }

        // Get remove index
        const removeIndex = post.comments
          .map(item => item._id.toString())
          .indexOf(req.params.comment_id);

        // Splice comment from array
        post.comments.splice(removeIndex, 1);

        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnotfound: "No post found" }));
  }
);

module.exports = router;
