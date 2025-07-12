const { QueryCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const docClient = require('../db');
const USERS_TABLE = process.env.USERS_TABLE;

async function getUserByEmail(email) {
  const params = {
    TableName: USERS_TABLE,
    IndexName: 'email-index', // Ensure GSI on 'email'
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email },
  };
  const result = await docClient.send(new QueryCommand(params));
  return result.Items[0];
}

async function createUser(user) {
  const params = {
    TableName: USERS_TABLE,
    Item: user,
    ConditionExpression: 'attribute_not_exists(email)',
  };
  await docClient.send(new PutCommand(params));
}

module.exports = { getUserByEmail, createUser };
