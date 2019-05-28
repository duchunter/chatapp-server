const {
  createUser,
  getUserInfo,
  updateGroup,
  updateFriend,
  updateUserInfo,
  updatePassword,
  updateAvatar,
  updateName,
  removeGroup,
  removeFriend
} = require('../models');

async function getAllFriends({ username }) {
  const userInfo = await getUserInfo({ username });
  if (userInfo) {
    const friendPromises = userInfo.friends.map(friend => {
      return getUserInfo({ username: friend });
    });
    return await Promise.all(friendPromises);
  }

  return [];
}

module.exports = {
  createUser,
  getUserInfo,
  getAllFriends,
  updateGroup,
  updateFriend,
  updateUserInfo,
  updatePassword,
  updateAvatar,
  updateName,
  removeGroup,
  removeFriend
};
