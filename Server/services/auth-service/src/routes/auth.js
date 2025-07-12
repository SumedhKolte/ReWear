const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const Joi = require('joi');
const validateInput = require('../middleware/validateInput');
const { signupValidationRules, validate } = require('../middleware/validateSignup');

const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  displayName: Joi.string().min(2).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

router.post('/signup', signupValidationRules, validate, authController.signup);
router.post('/login', validateInput(loginSchema), authController.login);

module.exports = router;