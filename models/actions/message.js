/********** Message CRUD **********/
let { Message } = require('../schemas.js');

// Get message
async function getGroupMessages({ groupId, limit }) {
  let messages = [];
  try {
    messages = await Message.find(
      { group_id: groupId },
      null,
      {
        limit,
        sort: { created : -1}
      }
    );
  } catch (e) {
    console.log(e);
  } finally {
    return messages;
  }
}

// Create Message
async function createMessage(payload) {
  let newMessage = new Message(payload);
  try {
    await newMessage.save();
    return newMessage;
  } catch (e) {
    console.log(e);
    return null
  }
}
