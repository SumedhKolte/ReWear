const Joi = require('joi');

const contactSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  message: Joi.string().min(10).max(2000).required()
});

const validateContact = (req, res, next) => {
  const { error } = contactSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }
  
  next();
};

module.exports = { validateContact };
