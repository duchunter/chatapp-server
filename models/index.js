let userInfo = {
  username: 'test',
  password: 'test',
  name: 'test',
  avatar: 'test',
  friends: ['test']
}

let notification = {
  username: 'test',
  created: 0,
  content: 'test content',
  type: 0
}

let group = {
  id: 'testid',
  name: 'test',
  members: []
}

let message = {
  group: 'test',
  sender: 'test',
  created: 0,
  content: 'test content'
}

function getUserInfo(username) {
  return {
    info: userInfo,
    groups: [group],
    notifications: [notification]
  }
}

function updateUserInfo(username, data) {
  return true;
}

module.exports = {
  getUserInfo,
  updateUserInfo,
}
