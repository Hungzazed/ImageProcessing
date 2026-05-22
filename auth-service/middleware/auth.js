const jwt = require('jsonwebtoken')
const User = require('../model/user')

const getAccessTokenFromRequest = (req) => {
    const authorization = req.headers.authorization;

    if (!authorization) return null;

    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) return null;

    return token;
}

const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

// Middleware xác thực accessToken
const auth = function (req, res, next) {
    const token = getAccessTokenFromRequest(req);

    if (!token) return res.status(401).json({ message: "No token" })

    try {
        const decoded = verifyAccessToken(token);
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

module.exports = { auth, checkAdmin, getAccessTokenFromRequest, verifyAccessToken };