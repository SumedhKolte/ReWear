// models/user.js
const { QueryCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const docClient = require('../db');

const USERS_TABLE = process.env.USERS_TABLE;

async function getUserByEmail(email) {
  const params = {
    TableName: USERS_TABLE,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email },
  };

  try {
    const result = await docClient.send(new QueryCommand(params));
    return result.Items[0];
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}

async function createUser(user) {
  const params = {
    TableName: USERS_TABLE,
    Item: {
      userId: user.userId,
      email: user.email,
      passwordHash: user.passwordHash, // Match controller field name
      displayName: user.displayName,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt
    },
    ConditionExpression: 'attribute_not_exists(email)',
  };

  try {
    await docClient.send(new PutCommand(params));
    return user; // Return the created user
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

module.exports = { getUserByEmail, createUser };
