let io = require('socket.io')();

const {
  getDataWhenConnected,
  getUserInfo,
  updateUserInfo,
  createFriendRequestNoti,
  deleteNotification,
  updateFriend,
  updateGroupName,
  createMessage,
  removeMember,
  removeGroup,
  getGroupInfo,
  createKickMemberNoti,
  addMember,
  updateGroup,
  createGroup,
  removeFriend,
  createFriendAcceptNoti,
  createFriendDenyNoti
} = require('../controllers');

// Get all current rooms
// function getAllRooms() {
//   return Object.keys(io.sockets.adapter.rooms);
// }

// Kick user from room
function kickUserFromRoom(room, username) {
  let socketId = Object.keys(io.sockets.adapter.rooms[ username ].sockets)[ 0 ];
  io.sockets.sockets[ socketId ].leave(room);
}

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
    delete info.password;
    if (callback) {
      callback(info);
    }
  });

  // Update user info
  socket.on('update-user-info', async ({ info }, callback) => {
    let isSuccess = await updateUserInfo(state.username, info);
    if (isSuccess) {
      // Notify all friend
      state.info.friends.forEach(user => {
        io.to(user).emit('friend-update-profile', state.info);
      });
    }

    if (callback) {
      callback(isSuccess);
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
  socket.on('handle-friend-request', async ({ sender, accepted }, callback) => {
    const { username, name, avatar } = state;
    if (accepted) {
      const results = await Promise.all([
        updateFriend({ username, friendname: sender }),
        updateFriend({ username: sender, friendname: username })
      ]);

      const isSuccess = results.all(status => status);
      if (isSuccess) {
        const noti = await createFriendAcceptNoti({
          sender,
          receiver: { username, name, avatar }
        });
        io.to(sender).emit('notification', noti);
      }

      // Update user info
      let userFriendList = await updateFriend(state.username);
      io.to(state.username).emit('update-friend-list', userFriendList);

      if (callback) {
        callback(isSuccess);
      }
    } else {
      // Notify sender that he/she has been rejected
      const noti = await createFriendDenyNoti({
        sender,
        receiver: { username, name, avatar }
      });
      io.to(sender).emit('notification', noti);
      if (callback) {
        callback();
      }
    }
  });

  // Unfriend
  socket.on('unfriend', async ({ username }, callback) => {
    const results = await Promise.all([
      removeFriend({ username: state.username, friendname: username }),
      removeFriend({ username, friendname: state.username })
    ]);

    const isSuccess = results.all(status => status);

    if (isSuccess) {
      const { friends } = await getUserInfo({ username });
      io.to(username).emit('update-friend-list', friends);
    }

    if (callback) {
      callback(isSuccess);
    }
  });

  // Create group chat
  socket.on('create-group-chat', async ({ members, name }, callback) => {
    const group = await createGroup({ members, name });
    members.forEach(user => {
      io.to(user).emit('new-group-chat', group);
    });

    if (callback) {
      callback();
    }
  });

  // Add member to group chat
  socket.on('add-member', async ({ groupId, username }, callback) => {
    const results = await Promise.all([
      addMember({ groupId, username }),
      updateGroup({ groupId, username })
    ]);

    const isSuccess = results.all(status => status);

    if (isSuccess) {
      // Update group chat info of all current member in the room
      const groupInfo = getGroupInfo({ groupId });
      io.to(groupId).emit('update-group-chat', groupInfo);

      // Notify new member
      io.to(username).emit('added-to-group', groupInfo);
    }

    if (callback) {
      callback(isSuccess);
    }
  });

  // Leave/Kick member from group chat
  socket.on('remove-member', async ({ groupId, username }, callback) => {
    const results = await Promise.all([
      removeMember({ groupId, username }),
      removeGroup({ groupId, username })
    ]);

    const isSuccess = results.all(status => status);

    if (isSuccess) {
      // Kick user from room
      kickUserFromRoom(groupId, username);

      // Update group chat info of all current member in the room
      const groupInfo = getGroupInfo({ groupId });
      io.to(groupId).emit('update-group-chat', groupInfo);

      // If the action is kick, notify that kicked member
      if (state.username !== username) {
        let noti = await createKickMemberNoti({
          group: groupId,
          receiver: username
        });
        io.to(username).emit('notification', noti);
      }
    }

    if (callback) {
      callback(isSuccess);
    }
  });

  // Update group chat info
  socket.on('update-group-chat-info', async ({ group }, callback) => {
    const { name, id } = group;
    const isSuccess = await updateGroupName({ name, groupId: id });

    if (isSuccess) {
      // Update group chat info of all current member in the room
      io.to(group.id).emit('update-group-chat', group);
    }

    if (callback) {
      callback(isSuccess);
    }
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

module.exports = io;
