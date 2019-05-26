/** ******** Groups CRUD **********/
let { Group } = require('../schemas.js');

// Create group
async function createGroup(payload) {
  const newGroup = new Group(payload);
  try {
    await newGroup.save();
    return newGroup;
  } catch (e) {
    console.log(e);
    return null;
  }
}

// Get group members
async function getGroupInfo({ groupId }) {
  let groupInfo = null;
  try {
    groupInfo = await Group.findOne({ _id: groupId });
  } catch (e) {
    console.log(e);
  } finally {
    return groupInfo;
  }
}

// Update group members
async function addMember({ groupId, username }) {
  try {
    await Group.updateOne({ _id: groupId }, { $push: { members: username } });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

// Update group name
async function updateGroupName({ groupId, name }) {
  try {
    await Group.updateOne({ _id: groupId }, { name });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

// Remove group member
async function removeMember({ groupId, username }) {
  try {
    await Group.updateOne({ _id: groupId }, { $pull: { members: username } });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

module.exports = {
  createGroup,
  getGroupInfo,
  addMember,
  updateGroupName,
  removeMember
};
