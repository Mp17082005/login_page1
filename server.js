const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const socketIo = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// MongoDB Atlas Connection
const mongoURI = "mongodb+srv://maheshpandey_theadmin:Mpandey170805@cluster0.dfb4k.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB Atlas Connected Successfully"))
.catch(err => console.error("MongoDB Connection Error:", err));

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

const User = mongoose.model('User', UserSchema);

// Signup Route
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });

    await user.save();
    io.emit('user_registered', user);
    res.json({ message: "User registered successfully" });

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id }, 'secretKey', { expiresIn: '1h' });
    res.json({ message: "Login successful", token });

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

server.listen(5000, () => console.log("Server running on port 5000"));
