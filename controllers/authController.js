const bcrypt = require("bcrypt");
const User = require("../models/User");

// Register User
exports.register = async (req, res) => {

    try {

        const { username, password } = req.body;

        const userExists = await User.findOne({ username });

        if (userExists) {
            return res.send("User already exists.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            password: hashedPassword
        });

        await newUser.save();

        res.send("Registration Successful ❤️");

    } catch (err) {

        console.log(err);
        res.send("Registration Failed");

    }

};

// Login User
exports.login = async (req, res) => {

    try {

        const { username, password } = req.body;

        const user = await User.findOne({ username });

        if (!user) {
            return res.send("User Not Found");
        }

        // Check if locked
        if (user.lockUntil && user.lockUntil > Date.now()) {

            const remaining = Math.ceil((user.lockUntil - Date.now()) / 1000);

            return res.send(`Account Locked. Try again after ${remaining} seconds.`);
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {

            user.failedAttempts++;

            if (user.failedAttempts >= 3) {

                user.lockUntil = new Date(Date.now() + 30000);
                user.failedAttempts = 0;

            }

            await user.save();

            return res.send("Wrong Password");

        }

        user.failedAttempts = 0;
        user.lockUntil = null;

        await user.save();

        req.session.user = user.username;

        res.send("Login Successful ❤️");

    } catch (err) {

        console.log(err);
        res.send("Login Failed");

    }

};

// Logout
exports.logout = (req, res) => {

    req.session.destroy(() => {

        res.send("Logged Out");

    });

};