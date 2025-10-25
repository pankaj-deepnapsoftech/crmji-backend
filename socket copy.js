const { Message } = require("./models/chat");  // Import the Message model
const path = require('path');
const fs = require("fs");
const { PassThrough, pipeline } = require('stream');
module.exports = (socket, io) => {
    // console.log('A user connected: ' + socket.id);
    // Store active upload streams by socket ID
    const UPLOAD_DIR = path.join(__dirname, './tmp', 'uploads');
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
    const activeUploads = {};
    users = {};  // Initialize an empty object to store users
    // Register a user with their username and join a room
    socket.on('register', (username) => {
        users[username] = socket.id;
        // console.log(`User ${username} registered with socket ID ${socket.id}`);
        socket.join(username);  // Join the user to a room named after their username
    });

    // share file using socket.io
    socket.on('start upload', ({ fileName, sender, recipient, message }) => {
        const uniqueFileName = `${Date.now()}-${fileName}`;
        const filePath = path.join(UPLOAD_DIR, uniqueFileName);

        const passThrough = new PassThrough();
        const fileStream = fs.createWriteStream(filePath);

        activeUploads[socket.id] = { passThrough, fileStream, filePath, meta: { sender, recipient, message, fileName: uniqueFileName, original_name: fileName } };

        pipeline(
            passThrough,
            fileStream,
            async (err) => {
                if (err) {
                    console.error('Pipeline failed:', err);
                } else {
                    const { sender, recipient, message, fileName, original_name } = activeUploads[socket.id].meta;
                    console.log('File upload completed:', original_name);
                    const msg = new Message({
                        sender,
                        recipient,
                        message,
                        file: `uploads/${fileName}`,
                        fileName: original_name,
                    });
                    await msg.save();
                    io.to(sender).to(recipient).emit('receiveMessage', msg);
                }
                delete activeUploads[socket.id];
            }
        );
    });

    socket.on('file chunk', (chunk) => {
        const upload = activeUploads[socket.id];
        if (upload && upload.passThrough) {
            upload.passThrough.write(Buffer.from(chunk));
        }
    });

    socket.on('file chunk end', () => {
        const upload = activeUploads[socket.id];
        if (upload && upload.passThrough) {
            upload.passThrough.end(); // Signal the end of streaming
        }
    });



    // Send a message to a specific user
    socket.on('sendMessage', async (data) => {
        // console.log('Sending message:', data);
        const { sender, recipient, message } = data;
        // Save the message to MongoDB
        const newMessage = new Message({
            sender,
            recipient,
            message,
        });

        try {
            const savedMessage = await newMessage.save();
            // console.log('Message saved:', newMessage);

            // Emit the message to both users by joining the room
            console.log(`Emitting message to ${sender} and ${recipient}`);
            io.to(sender).to(recipient).emit('receiveMessage', savedMessage);
        } catch (err) {
            console.error('Error saving message:', err);
        }
    });

    // Get all messages between two users
    socket.on('getMessages', async (data) => {
        const { user1, user2 } = data;
        try {
            // Find all messages exchanged between the two users
            const userMessages = await Message.find({
                $or: [
                    { sender: user1, recipient: user2 },
                    { sender: user2, recipient: user1 },
                ],
            }).sort({ timestamp: 1 });  // Sort messages by timestamp
            // console.log('Retrieved messages:', userMessages);
            socket.emit('allMessages', userMessages);  // Send messages to the requesting user
        } catch (err) {
            console.error('Error retrieving messages:', err);
        }
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        // console.log('A user disconnected: ' + socket.id);
        for (let username in users) {
            if (users[username] === socket.id) {
                delete users[username];
                break;
            }
        }
    });



    // groupChat connections and messages
    socket.on('joinGroup', (groupId) => {
        socket.join(groupId);  // Join the group chat room
        console.log(`User ${socket.id} joined group ${groupId}`);
    });
    socket.on('sendGroupMessage', async (data) => {
        const { sender, groupId, message } = data;
        const newMessage = new Message({
            sender,
            groupId,
            message,
        });

        try {
            const savedMessage = await newMessage.save();
            console.log('Group message saved:', newMessage);
            io.to(groupId).emit('receiveGroupMessage', savedMessage);  // Emit the message to the group
        } catch (err) {
            console.error('Error saving group message:', err);
        }
    });

    socket.on('startgroupupload', ({ fileName, sender, groupMessage, message }) => {
        const uniqueFileName = `${Date.now()}-${fileName}`;
        const filePath = path.join(UPLOAD_DIR, uniqueFileName);

        const passThrough = new PassThrough();
        const fileStream = fs.createWriteStream(filePath);

        activeUploads[socket.id] = { passThrough, fileStream, filePath, meta: { sender, groupMessage, message, fileName: uniqueFileName, original_name: fileName } };

        pipeline(
            passThrough,
            fileStream,
            async (err) => {
                if (err) {
                    console.error('Pipeline failed:', err);
                } else {
                    const { sender, groupMessage, message, fileName, original_name } = activeUploads[socket.id].meta;
                    console.log('File upload completed:', original_name);
                    const msg = new Message({
                        sender,
                        groupMessage,
                        message,
                        file: `uploads/${fileName}`,
                        fileName: original_name,
                    });
                    await msg.save();
                    io.to(groupMessage).emit('receiveGroupMessage', msg);
                }
                delete activeUploads[socket.id];
            }
        );
    });

    // Get all messages between two users
    socket.on('getgroupMessages', async (data) => {
        const { groupMessage } = data;
        try {
            // Find all messages exchanged between the two users
            const userMessages = await Message.find({ groupMessage  }).sort({ timestamp: 1 });  // Sort messages by timestamp
            console.log('Retrieved group messages:');
            console.log('Retrieved group messages:', userMessages);
            socket.emit('allgroupMessages', userMessages);  // Send messages to the requesting user
        } catch (err) {
            console.error('Error retrieving messages:', err);
        }
    });
};
