const notification = require('./notification');
const message = require('./message');
const group = require('./group');
const user = require('./user');

async function getDataWhenConnected({ username }) {
  const { getUserInfo } = user;
  const { getNotifications } = notification;
  const { getGroupInfo } = group;
  const { getMessages } = message;

  // Get user info and noti first
  let [ userInfo, notifications ] = await Promise.all([
    getUserInfo({ username }),
    getNotifications({ username })
  ]);

  // Get list of friend and groups from user info
  let { friends, groups } = userInfo;

  // Get all friend info, group info and top message at the same time
  let friendPromises = friends.map(friend => {
    return getUserInfo({ username: friend });
  });
  let getAllFriendInfo = Promise.all(friendPromises);

  let groupPromises = groups.map(groupId => {
    return getGroupInfo({ groupId });
  });
  let getAllGroupInfo = Promise.all(groupPromises);

  let messagePromises = groups.map(groupId => {
    return getMessages({ groupId, limit: 100 });
  });
  let getAllTopMessages = Promise.all(messagePromises);

  let [ allFriends, allGroups, allTopMessages ] = await Promise.all([
    getAllFriendInfo,
    getAllGroupInfo,
    getAllTopMessages
  ]);

  // Don't return password + only username, name, ava for friends
  delete userInfo.password;
  return {
    ...userInfo,
    notifications,
    friends: allFriends.map(friend => {
      const { username, name, avatar } = friend;
      return { username, name, avatar };
    }),
    groups: allGroups.map((group, index) => {
      return {
        ...group,
        messages: allTopMessages[ index ]
      };
    })
  };
}

module.exports = {
  ...notification,
  ...message,
  ...group,
  ...user,
  getDataWhenConnected
};
