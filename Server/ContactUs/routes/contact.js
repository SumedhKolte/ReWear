const express = require('express');
const { submitContactForm } = require('../controllers/contactController');
const { validateContact } = require('../utils/validation');

const router = express.Router();

router.post('/submit', validateContact, async (req, res, next) => {
  try {
    const result = await submitContactForm(req.body, req.ip);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
