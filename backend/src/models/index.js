/**
 * Central models index — import all models from one place
 *
 * Usage:
 *   const { UserModel, ConversationModel } = require('../models');
 */
const UserModel = require('./user.model');
const ConversationModel = require('./conversation.model');
const MessageModel = require('./message.model');
const SubscriptionModel = require('./subscription.model');
const OAuthTokenModel = require('./oauthToken.model');
const AiActionLogModel = require('./aiActionLog.model');

module.exports = {
  UserModel,
  ConversationModel,
  MessageModel,
  SubscriptionModel,
  OAuthTokenModel,
  AiActionLogModel,
};
