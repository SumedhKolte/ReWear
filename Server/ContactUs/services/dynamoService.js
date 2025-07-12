const AWS = require('aws-sdk');

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbClient = new AWS.DynamoDB(); // For table operations
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

// Table creation function
const createTableIfNotExists = async () => {
  try {
    // Check if table exists
    await dynamodbClient.describeTable({ TableName: TABLE_NAME }).promise();
    console.log(`✅ Table '${TABLE_NAME}' already exists`);
  } catch (error) {
    if (error.code === 'ResourceNotFoundException') {
      console.log(`📝 Creating table '${TABLE_NAME}'...`);
      
      const params = {
        TableName: TABLE_NAME,
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH'
          }
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S'
          }
        ],
        BillingMode: 'PAY_PER_REQUEST'
      };

      await dynamodbClient.createTable(params).promise();
      console.log(`✅ Table '${TABLE_NAME}' created successfully!`);
      
      // Wait for table to be active
      await dynamodbClient.waitFor('tableExists', { TableName: TABLE_NAME }).promise();
      console.log(`✅ Table '${TABLE_NAME}' is now active`);
    } else {
      console.error('Error checking table:', error);
      throw error;
    }
  }
};

const createContactSubmission = async (submission) => {
  // Ensure the submission has an 'id' field (primary key)
  if (!submission.id) {
    throw new Error('Submission must have an id field');
  }

  const params = {
    TableName: TABLE_NAME,
    Item: {
      id: submission.id,
      name: submission.name,
      email: submission.email,
      message: submission.message,
      status: submission.status || 'pending',
      clientIp: submission.clientIp,
      createdAt: submission.createdAt
    }
  };

  try {
    console.log('Attempting to save to DynamoDB:', params);
    await dynamodb.put(params).promise();
    console.log('Successfully saved to DynamoDB');
    return submission;
  } catch (error) {
    console.error('DynamoDB Error Details:', {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      requestId: error.requestId
    });
    throw new Error('Failed to save contact submission');
  }
};

module.exports = { 
  createContactSubmission,
  createTableIfNotExists 
};
