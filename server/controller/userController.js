// Package Imports
const userModel = require("../models/userModel");

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const fs = require("fs");

// Variables
let passwordAttempt = 0;

let profilePicture = "";

// Register a new user
const registerUser = async (req, res) => {
  try {
    // Check if the user has uploaded a profile picture
    if (req.file) {
      profilePicture = req.file.filename;
    }

    // Deconstruct the request body
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({
        message: "Please fill in all fields",
        success: false,
      });
    }

    // Check if the user already exists
    const userExists = await userModel.findOne({ email: email });

    if (userExists) {
      return res.status(400).json({
        message: "User with this email already exists",
        success: false,
      });
    }

    // Check if the phone number is already taken
    const phoneExists = await userModel.findOne({
      phone: phone,
    });

    if (phoneExists) {
      return res.status(400).json({
        message: "Phone number already exists",
        success: false,
      });
    }

    // Hash the password
    const randomSalt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, randomSalt);

    // Create a new user
    const newUser = new userModel({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      profilePic: profilePicture,
    });

    // Save the user
    await newUser.save();

    return res.status(200).json({
      message: "User registered successfully",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error,
    });
  }
};

const loginUser = async (req, res) => {
  // Deconstruct the request body
  const { email, password } = req.body;

  // Check if the user does not exist
  const user = await userModel.findOne({ email: email });

  if (!user) {
    return res.status(400).json({
      message: "User not found",
      success: false,
    });
  }

  try {
    // Check if the password is correct
    const passwordMatch = await bcrypt.compare(password, user.password);
    passwordAttempt++;

    if (passwordAttempt > 3) {
      return res.status(400).json({
        message: "Too many password attempts",
        success: false,
      });
    }

    if (!passwordMatch) {
      return res.status(400).json({
        message: "Invalid password",
        success: false,
      });
    }

    // Create a token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET
    );

    return res.status(200).json({
      message: "User logged in successfully",
      success: true,
      token: token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error,
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User found",
      user: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error,
    });
  }
};

const editUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    const existingUser = await userModel.findById(req.user.id);
    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    let updatedFields = {
      firstName: firstName || existingUser.firstName,
      lastName: lastName || existingUser.lastName,
      email: email || existingUser.email,
      phone: phone || existingUser.phone,
      profilePic: existingUser.profilePic,
    };

    // Handle file upload
    if (req.file) {
      const newImage = req.file.filename;

      // Delete the old image
      if (existingUser.profilePic) {
        const oldImage = path.join(
          __dirname,
          `../public/uploads/${existingUser.profilePic}`
        );
        if (fs.existsSync(oldImage)) {
          fs.unlinkSync(oldImage);
        }
      }

      if (req.file) {
        existingUser.profilePic = req.file.filename;
      }

      updatedFields.profilePic = newImage;
    }

    try {
      const updatedUser = await userModel.findByIdAndUpdate(
        req.params.id,
        updatedFields,
        { new: true, runValidators: true }
      );

      if (updatedUser) {
        return res.status(200).json({
          success: true,
          message: "User updated",
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Error updating user",
        error: error,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error,
    });
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    const { friendId } = req.body;
    const user = await userModel.findById(req.user.id);
    const friend = await userModel.findById(friendId);

    if (!friend) {
      return res.status(400).json({
        success: false,
        message: "Friend not found",
      });
    }

    if (user.friends.includes(friendId)) {
      return res.status(400).json({
        success: false,
        message: "Friend already added",
      });
    }

    if (user.friendRequests.includes(friendId)) {
      return res.status(400).json({
        success: false,
        message: "Friend request already sent",
      });
    }

    try {
      user.friendRequests.push(friendId);
      await user.save();
      friend.friendRequests.push(req.user.id);
      await friend.save();

      return res.status(200).json({
        success: true,
        message: "Friend request sent",
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Error sending friend request",
        error: error,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error,
    });
  }
};

const addFriend = async (req, res) => {
  try {
    const { friendId } = req.body;
    const user = await userModel.findById(req.user.id);
    const friend = await userModel.findById(friendId);

    if (!friend) {
      return res.status(400).json({
        success: false,
        message: "Friend not found",
      });
    }

    if (user.friends.includes(friendId)) {
      return res.status(400).json({
        success: false,
        message: "Friend already added",
      });
    }

    user.friends.push(friendId);
    friend.friends.push(req.user.id);

    await user.save();
    await friend.save();

    return res.status(200).json({
      success: true,
      message: "Friend added successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error,
    });
  }
};

const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.body;
    const user = await userModel.findById(req.user.id);
    const friend = await userModel.findById(friendId);

    if (!user.friends.includes(friendId)) {
      return res.status(400).json({
        success: false,
        message: "Friend not found",
      });
    }

    try {
      user.friends.pop(friendId);
      friend.friends.pop(req.user.id);

      await user.save();
      await friend.save();

      return res.status(200).json({
        success: true,
        message: "Friend removed successfully",
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Error removing friend",
        error: error,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  editUser,
  addFriend,
  removeFriend,
  friendRequest: sendFriendRequest,
  getCurrentUser,
};
