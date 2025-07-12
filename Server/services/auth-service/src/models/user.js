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
} // ← This closing brace was missing

async function createUser(user) {
  const params = {
    TableName: USERS_TABLE,
    Item: user,
    ConditionExpression: 'attribute_not_exists(email)',
  };

  try {
    await docClient.send(new PutCommand(params));
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
} // ← This closing brace was missing

module.exports = { getUserByEmail, createUser };
