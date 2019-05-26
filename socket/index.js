let io = require('socket.io')();

const {
  getDataWhenConnected,
  getUserInfo,
  updateUserInfo,
  createFriendRequestNoti,
  deleteNotification,
  updateFriend,
  createMessage
} = require('chatapp/controllers');

io.on('connection', (socket) => {
  let state = {};

  // Connect to app
  socket.on('user-connected', async ({ username }, callback) => {
    // Join user private room
    socket.join(username);

    // Get user data and noti
    let userInfo = await getDataWhenConnected({ username });
    if (callback) {
      callback(userInfo);
    }

    // Store state to save searching time
    state = { ...userInfo };

    // Join all group chat
    userInfo.groups.forEach(group => {
      socket.join(group.id);
    });

    // Emit all friends that user is online
    userInfo.friends.forEach(user => {
      io.to(user.username).emit('friend-online', username);
    });
  });

  // Get user info
  socket.on('get-user-info', ({ username }, callback) => {
    let info = getUserInfo(username);
    if (callback) {
      callback(info);
    }
  });

  // Update user info
  socket.on('update-user-info', async ({ info }, callback) => {
    let isSuccess = await updateUserInfo(state.username, info);
    if (isSuccess) {
      if (callback) {
        callback(isSuccess);
      }

      // Notify all friend
      state.info.friends.forEach(user => {
        io.to(user).emit('friend-update-profile', state.info);
      });
    }
  });

  // Delete notification
  socket.on('delete-notification', async ({ ids }, callback) => {
    const notiPromises = ids.map(id => deleteNotification({ id }));
    const results = Promise.all(notiPromises);
    const isSuccess = results.every(status => status);
    if (callback) {
      callback(isSuccess);
    }
  });

  // Add new friend
  socket.on('add-friend', async ({ receiverUsername }, callback) => {
    // TODO: create noti
    let { username, name } = state;
    const noti = await createFriendRequestNoti({
      sender: { username, name },
      receiver: { username: receiverUsername }
    });

    // Emit noti
    io.to(receiverUsername).emit('notification', noti);

    if (callback) {
      callback(!!noti);
    }
  });

  // Handle friend request
  socket.on('handle-friend-request', ({ sender, accepted }, callback) => {
    if (accepted) {
      // Update user info
      let userFriendList = updateFriend(state.username);
      io.to(state.username).emit('update-friend-list', userFriendList);

      // Update sender info and notify him/her
      let senderFriendList = updateFriendList(sender);
      let noti = createNotification();
      io.to(sender).emit('update-friend-list', userFriendList);
      io.to(sender).emit('notification', noti);
    } else {
      // Notify sender that he/she has been rejected
      let noti = createNotification();
      io.to(sender).emit('notification', noti);
    }

    callback && callback();
  });

  // Unfriend
  socket.on('unfriend', ({ username }, callback) => {
    // Update user info
    let userFriendList = udpateFriendList(state.username);
    io.to(state.username).emit('update-friend-list', userFriendList);

    // Update sender info and notify him/her
    let senderFriendList = updateFriendList(sender);
    let noti = createNotification();
    io.to(sender).emit('update-friend-list', userFriendList);
    io.to(sender).emit('notification', noti);

    callback && callback();
  });

  // Create group chat
  socket.on('create-group-chat', ({ members, name }, callback) => {
    let group = createGroupChat();
    members.forEach(user => {
      io.to(user).emit('new-group-chat', group);
    });

    callback && callback();
  });

  // Add member to group chat
  socket.on('add-member', ({ groupId, username }, callback) => {
    let group = updateGroupChat();
    // TODO: add top message for new member
    // TODO: add members info

    // Update group chat info of all current member in the room
    io.to(groupId).emit('update-group-chat', group);

    // Notify new member
    io.to(username).emit('added-to-group', group);

    callback && callback();
  });

  // Leave/Kick member from group chat
  socket.on('remove-member', ({ groupId, username }, callback) => {
    let group = updateGroupChat();

    // Kick user from the room
    kickUserFromRoom(groupId, username);

    // Update group chat info of all current member in the room
    io.to(groupId).emit('update-group-chat', group);

    // If the action is kick, notify that kicked member
    if (state.username != username) {
      let noti = createNotification();
      io.to(username).emit('notification', noti);
    }

    callback && callback();
  });

  // Update group chat info
  socket.on('update-group-chat-info', ({ group }, callback) => {
    let info = updateGroupChat();

    // Update group chat info of all current member in the room
    io.to(groupId).emit('update-group-chat', info);

    callback && callback();
  });

  // Chat text
  socket.on('chat-text', ({ message }, callback) => {
    const msg = createMessage(message);
    if (callback) {
      callback(!!msg);
    }

    io.to(message.group_id).broadcast.emit('chat-message', msg);
  });
});

// Get all current rooms
// function getAllRooms() {
//   return Object.keys(io.sockets.adapter.rooms);
// }

// Kick user from room
function kickUserFromRoom(room, username) {
  let socketId = Object.keys(io.sockets.adapter.rooms[ username ].sockets)[ 0 ];
  io.sockets.sockets[ socketId ].leave(room);
}

module.exports = io;
