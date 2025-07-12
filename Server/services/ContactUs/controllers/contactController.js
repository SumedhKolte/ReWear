const { v4: uuidv4 } = require('uuid');
const dynamoService = require('../services/dynamoService');

const submitContactForm = async (formData, clientIp) => {
  try {
    // Sanitize and prepare submission data
    const submission = {
      id: uuidv4(), // Generate unique ID for DynamoDB primary key
      name: formData.name.trim(),
      email: formData.email.toLowerCase().trim(),
      message: formData.message.trim(),
      status: 'pending',
      clientIp: clientIp || 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to DynamoDB
    await dynamoService.createContactSubmission(submission);

    // Return success response
    return {
      success: true,
      message: 'Thank you for your message! We\'ll get back to you soon.',
      submissionId: submission.id
    };
  } catch (error) {
    console.error('Error submitting contact form:', error);
    throw new Error('Failed to submit contact form');
  }
};

module.exports = { submitContactForm };
