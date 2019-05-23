/********** Notification CRUD **********/
let { Notification } = require('../schemas.js');

async function getNotifications({ username }) {
  try {
    let notifications = await Notification.find(
      { username },
      null,
      { sort: { created : -1} }
    );
    return notifications;
  } catch (e) {
    console.log(e);
    return [];
  }
}

async function createNotification(payload) {
  const newNotification = new Notification({...payload});
  try {
    await newNotification.save();
    return newNotification;
  } catch (e) {
    console.log(e);
    return null;
  }
}

module.exports = {
  getNotifications,
  createNotification
}
