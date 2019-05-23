/********** User CRUD **********/
let { User } = require('../schemas.js');

// Create user
async function createUser(payload) {
  const newUser = new User(payload);
  try {
    await newUser.save();
    return newUser;
  } catch (e) {
    console.log(e);
    return null;
  }
}

// Get User info
async function getUserInfo({ username }) {
  try {
    let user = await User.findOne({ username });
    return user;
  } catch (e) {
    console.log(e);
    return null;
  }
}

// Update group to user info
async function updateGroup({ username, groupId }) {
  try {
    await User.updateOne({ username }, { $push: { groups: groupId } });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

// Update user friendlist
async function updateFriend({ username, friendname }) {
  try {
    await User.updateOne({ username }, { $push: { friends: friendname } });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

// Update password
async function updatePassword({ username, password }) {
  try {
    await User.updateOne({ username }, { password });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

// Update avatar
async function updateAvatar({ username, avatar }) {
  try {
    await User.updateOne({ username }, { avatar });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

// Update name
async function updateName({ username, name }) {
  try {
    await User.updateOne({ username }, { name });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

// Remove group from user info
async function removeGroup({ username, groupId }) {
  try {
    await User.updateOne({ username }, { $pull: { groups: groupId } });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

// Remove friend
async function removeFriend({ username, friendname }) {
  try {
    await User.updateOne({ username}, { $pull: { friends: friendname } });
    return true;
  } catch (e) {
    console.log(e);
    return false
  }
}
