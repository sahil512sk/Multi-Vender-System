const User = require('../Model/user');

const currentUser = async (req, res) => {
    try {
        const {email, password} = req.body;

        const user = await User.findOne({email});

    }} catch (error) {}