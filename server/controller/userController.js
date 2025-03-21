// Package Imports
const userModel = require("../models/userModel");

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

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

module.exports = {
  registerUser,
  loginUser,
};
