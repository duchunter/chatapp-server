let io = require('socket.io')();

const {
  getDataWhenConnected,
  getUserInfo,
  updateUserInfo,
  createFriendRequestNoti,
  deleteNotification,
  updateFriend,
  getAllFriends,
  updateGroupName,
  createMessage,
  removeMember,
  removeGroup,
  getGroupInfo,
  getMessages,
  createKickMemberNoti,
  addMember,
  updateGroup,
  createGroup,
  removeFriend,
  createFriendAcceptNoti,
  createFriendDenyNoti
} = require('../controllers');

// Get all current rooms
function getAllRooms() {
  return Object.keys(io.sockets.adapter.rooms);
}

// Join user to room
function joinUserToRoom(room, username) {
  if (getAllRooms().includes(username)) {
    let socketId = Object.keys(io.sockets.adapter.rooms[ username ].sockets)[ 0 ];
    io.sockets.sockets[ socketId ].join(room);
  }
}

// Kick user from room
function kickUserFromRoom(room, username) {
  if (getAllRooms().includes(username)) {
    let socketId = Object.keys(io.sockets.adapter.rooms[ username ].sockets)[ 0 ];
    io.sockets.sockets[ socketId ].leave(room);
  }
}

io.on('connection', socket => {
  let state = {};

  // Connect to app
  socket.on('user-connected', async ({ username }, callback) => {
    // Join user private room
    socket.join(username);

    // Get user data and noti
    let userInfo = await getDataWhenConnected({ username });

    // Check all friends status
    const rooms = getAllRooms();
    userInfo.friends = userInfo.friends.map(user => {
      return {
        ...user,
        active: rooms.includes(user.username)
      };
    });

    if (callback) {
      callback(userInfo);
    }

    // Store state to save searching time
    state = { ...userInfo };

    // Join all group chat
    userInfo.groups.forEach(group => {
      socket.join(group._id);
    });

    // Emit all friends that user is online
    userInfo.friends.forEach(user => {
      io.to(user.username).emit('friend-online', username);
    });
  });

  // User log out
  socket.on('log-out', () => {
    state.friends.forEach(user => {
      io.to(user.username).emit('friend-offline', state.username);
    });
    socket.disconnect();
  });

  // Get user info
  socket.on('get-user-info', async ({ username }, callback) => {
    let info = await getUserInfo({ username });
    if (info) {
      delete info.password;
    }
    if (callback) {
      callback(info);
    }
  });

  // Update user info
  socket.on('update-user-info', async ({ info }, callback) => {
    const isSuccess = await updateUserInfo(info);
    const changes = { ...info };
    delete changes.password;
    if (isSuccess) {
      // Notify all friend
      state.friends.forEach(user => {
        io.to(user.username).emit('friend-update-profile', changes);
      });
    }

    if (callback) {
      callback(isSuccess);
    }
  });

  // Delete notification
  socket.on('delete-notification', async ({ ids }, callback) => {
    const notiPromises = ids.map(id => deleteNotification({ id }));
    const results = await Promise.all(notiPromises);
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

      const isSuccess = results.every(status => status);
      if (isSuccess) {
        const noti = await createFriendAcceptNoti({
          sender: { username: sender.username },
          receiver: { username, name, avatar }
        });
        io.to(sender).emit('notification', noti);
      }

      // Update user info
      let [ userFriendList, senderFriendList ] = await Promise.all([
        getAllFriends({ username }),
        getAllFriends({ username: sender })
      ]);

      const rooms = getAllRooms();

      io.to(username).emit(
        'update-friend-list',
        userFriendList.map(user => ({
          ...user,
          active: rooms.includes(user.username)
        }))
      );

      io.to(sender).emit(
        'update-friend-list',
        senderFriendList.map(user => ({
          ...user,
          active: rooms.includes(user.username)
        }))
      );

      state.friends = userFriendList;

      if (callback) {
        callback(isSuccess);
      }
    } else {
      // Notify sender that he/she has been rejected
      const noti = await createFriendDenyNoti({
        sender: { username: sender },
        receiver: { username, name, avatar }
      });
      io.to(sender).emit('notification', noti);
      if (callback) {
        callback(!!noti);
      }
    }
  });

  // Unfriend
  socket.on('unfriend', async ({ username }, callback) => {
    const results = await Promise.all([
      removeFriend({ username: state.username, friendname: username }),
      removeFriend({ username, friendname: state.username })
    ]);

    const isSuccess = results.every(status => status);

    if (isSuccess) {
      let [ userFriendList, senderFriendList ] = await Promise.all([
        getAllFriends({ username: state.username }),
        getAllFriends({ username })
      ]);

      const rooms = getAllRooms();

      io.to(state.username).emit(
        'update-friend-list',
        userFriendList.map(user => ({
          ...user,
          active: rooms.includes(user.username)
        }))
      );

      io.to(username).emit(
        'update-friend-list',
        senderFriendList.map(user => ({
          ...user,
          active: rooms.includes(user.username)
        }))
      );

      state.friends = userFriendList;
    }

    if (callback) {
      callback(isSuccess);
    }
  });

  // Create group chat
  socket.on('create-group-chat', async ({ members, name }, callback) => {
    const group = await createGroup({ members, name });
    members.forEach(username => {
      updateGroup({ groupId: group._id, username });
      io.to(username).emit('new-group-chat', group);
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

    const isSuccess = results.every(status => status);

    if (isSuccess) {
      // Update group chat info of all current member in the room
      const [ groupInfo, messages ] = await Promise.all([
        getGroupInfo({ groupId }),
        getMessages({ groupId, limit: 100 })
      ]);

      groupInfo.messages = messages;
      io.to(groupId).emit('update-group-chat', groupInfo);

      // Notify new member
      io.to(username).emit('added-to-group', groupInfo);
      joinUserToRoom(groupId, username);
    }

    if (callback) {
      callback(isSuccess);
    }
  });

  // Leave/Kick member from group chat
  socket.on('remove-member', async ({ groupId, username, groupName }, callback) => {
    const results = await Promise.all([
      removeMember({ groupId, username }),
      removeGroup({ groupId, username })
    ]);

    const isSuccess = results.every(status => status);

    if (isSuccess) {
      // Kick user from room
      kickUserFromRoom(groupId, username);

      // Update group chat info of all current member in the room
      const groupInfo = await getGroupInfo({ groupId });
      io.to(groupId).emit('update-group-chat', groupInfo);

      // If the action is kick, notify that kicked member
      if (state.username !== username) {
        let noti = await createKickMemberNoti({
          group: {
            _id: groupId,
            name: groupName
          },
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
  socket.on('chat-text', async ({ message }, callback) => {
    const msg = await createMessage(message);
    if (callback) {
      callback(!!msg);
    }

    io.to(message.group_id).emit('chat-message', msg);
  });
});

module.exports = io;
