const mongoose = require('mongoose');

// Connect to mongo
mongoose.connect("mongodb://localhost:27017/chatDB", { useNewUrlParser: true });

// Create schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  name: String,
  avatar: String,
  friends: [String],
  groups: [String]
});

const groupSchema = new mongoose.Schema({
  _id: String,
  name: String,
  members: [String]
});

const notificationSchema = new mongoose.Schema({
  username: String,
  created:{
    type: Date,
    default: Date.now
  },
  content: String,
  type: Number,
  extra_data: String
});

const messageSchema = new mongoose.Schema({
  group_id: String,
  sender: String,
  created:{
    type: Date,
    default: Date.now
  },
  content: String
});

// Create models based on schemas
const User = mongoose.model("User", userSchema);
const Group = mongoose.model("Group", groupSchema);
const Notification = mongoose.model("Notification", notificationSchema);
const Message = mongoose.model("Message", messageSchema);

module.exports = {
  User,
  Group,
  Notification,
  Message
}
