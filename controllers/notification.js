const {
  createNotification,
  getNotifications,
  deleteNotification
} = require('../models');

// Friend request notification
async function createFriendRequestNoti({ sender, receiver }) {
  let content = `${sender.name} has sent you a friend request.`;
  return await createNotification({
    content,
    username: receiver.username,
    type: 1,
    extra_data: sender.username
  });
}

// Friend accept notification
async function createFriendAcceptNoti({ sender, receiver }) {
  let content = `${receiver.name} has accepted your friend request.`;
  return await createNotification({
    content,
    username: sender.username,
    type: 0
  });
}

// Friend deny notification
async function createFriendDenyNoti({ sender, receiver }) {
  let content = `${receiver.name} has denied your friend request.`;
  return await createNotification({
    content,
    username: sender.username,
    type: 0
  });
}

// Kick member notification
async function createKickMemberNoti({ group, receiver }) {
  let content = 'You have been kicked from group ' + group.name;
  return await createNotification({
    content,
    username: receiver.username,
    type: 2,
    extra_data: group._id
  });
}

module.exports = {
  getNotifications,
  createFriendRequestNoti,
  createFriendAcceptNoti,
  createFriendDenyNoti,
  createKickMemberNoti,
  deleteNotification
};
