let group = require('./actions/group.js');
let message = require('./actions/message.js');
let notification = require('./actions/notification.js');
let user = require('./actions/user.js');

module.exports = {
  ...group,
  ...message,
  ...notification,
  ...user
};
