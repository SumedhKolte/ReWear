const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

const validateListing = [
  body('title').trim().isLength({ min: 5, max: 255 }).withMessage('Title must be between 5 and 255 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('type').trim().notEmpty().withMessage('Type is required'),
  body('size').trim().notEmpty().withMessage('Size is required'),
  body('condition').trim().notEmpty().withMessage('Condition is required'),
  body('originalPrice').isFloat({ min: 0 }).withMessage('Original price must be a positive number'),
  body('purchaseDate').isISO8601().withMessage('Valid purchase date is required'),
  handleValidationErrors
];

const validateSwapRequest = [
  body('receiverListingId').isInt().withMessage('Valid receiver listing ID is required'),
  body('initiatorListingId').isInt().withMessage('Valid initiator listing ID is required'),
  body('message').optional().trim().isLength({ max: 500 }).withMessage('Message must be less than 500 characters'),
  handleValidationErrors
];

module.exports = {
  validateListing,
  validateSwapRequest
};
