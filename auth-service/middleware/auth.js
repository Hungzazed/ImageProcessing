const jwt = require('jsonwebtoken')
const User = require('../model/user')

// Middleware xác thực accessToken
const auth = function (req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "No token" })

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        res.status(403).json({ message: "Invalid token" })
    }
}

// Middleware kiểm tra quyền admin
const checkAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied. Admin only" });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

module.exports = { auth, checkAdmin };