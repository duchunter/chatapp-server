const { getGroupMessages, createMessage } = require('../models');

module.exports = {
  createMessage,
  getMessages: getGroupMessages
};
