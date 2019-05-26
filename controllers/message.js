const { getGroupMessages, createMessage } = require('chatapp/models');

module.exports = {
  createMessage,
  getMessages: getGroupMessages
};
