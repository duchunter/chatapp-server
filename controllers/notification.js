// Friend request notification
function friendRequestNotification(sender, receiver){
  var friendRequestContent = sender + " sent you a friend request.";
  createInteractiveNotification(receiver, friendRequestContent, sender);
  console.log(friendRequestContent);
}

// Friend accept notification
function friendAcceptNotification(username, friendname){
  var friendAcceptNotificationContent = "You have became friend with " + friendname;
  createStaticNotification(username, friendAcceptNotificationContent);
  console.log(friendAcceptNotificationContent);
}

// Friend deny notification
function friendDenyNotification(username, friendname){
  var friendDenyNotificationContent = friendname + " denied your friend request.";
  createStaticNotification(username, friendDenyNotificationContent);
  console.log(friendDenyNotificationContent);
}

// Kick member notification
function kickMemberNotification(groupId, username){
  var kickContent = "You have been kicked from group " + groupId;
  createStaticNotification(username, kickContent);
  console.log(kickContent);
}

// Unfriend notification
function unfriendNotification(username, friendname){
  var unfriendNotificationContent = friendname + " has been removed from " + username + " friendlist.";
  createStaticNotification(username, unfriendNotificationContent);
  console.log(unfriendNotificationContent);
}
