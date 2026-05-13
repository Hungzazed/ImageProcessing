const User = require("../model/user");
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken');
const sendEmail = require("../utils/sendEmail");
const user = require("../model/user");

const verificationSecret =process.env.JWT_ACCESS_SECRET;

exports.register = async(req , res)=>{
    const {name , email , password} = req.body;

    const exits = await User.findOne({email});
    console.log(exits)
    if(exits) return res.status(400).json({message:"Email exits"});

    const hashed = await bcrypt.hash(password,10);

    const user = await User.create({
        name,
        email,
        password:hashed,
        isVerified: true
    })

    res.json({message:"Register success",user})
}
exports.login = async (req, res)=>{
    const {email , password} = req.body;

    const user = await User.findOne({email});

    if(!user) return res.status(400).json({message:"User not found"});

    const match = await bcrypt.compare(password,user.password);
    if(!match) return res.status(400).json({message:"Wrong password"});

    const accessToken = jwt.sign(
        {id:user._id},
        process.env.JWT_ACCESS_SECRET,
        {expiresIn:"30m"}
    );
    const refreshToken = jwt.sign(
         {id:user._id},
        process.env.JWT_REFRESH_SECRET,
        {expiresIn:"7d"}
    )
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken",refreshToken,{
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7*24*60*60*1000
    })
  const { password: _, refreshToken: __, ...userData} = user._doc;
    console.log('Login userData with role:', userData);
    res.json({message:"Login success",accessToken,user : userData})
}
exports.verifyEmail = async(req, res)=>{
    const {token} = req.params;
    try {
        const decoded = jwt.verify(token, verificationSecret);
        await User.findByIdAndUpdate(decoded.id,{
            isVerified:true
        })
        res.json({message:"Email verify successfull"})
    } catch (error) {
        res.status(400).json({message:"invalid token"})
    }
}
exports.refreshToken = async(req, res)=>{
    const token = req.cookies.refreshToken;

    if(!token) return res.status(400).json({message:"Refresh token require"})
    
    const user = await User.findOne({refreshToken:token});

    if(!user) return res.status(400).json({message:"Invalid refresh token"})

    try {
        jwt.verify(token,process.env.JWT_REFRESH_SECRET);
        const newAccessToken = jwt.sign(
            {id:user._id},
            process.env.JWT_ACCESS_SECRET,
            {expiresIn:'15m'}
        )
        res.json({accessToken: newAccessToken})
    } catch (error) {
        res.status(403).json({message:"Refresh token expired"})
    }      
}
exports.logout = async(req,res)=>{
    const token = req.cookies.refreshToken;
    if(token){
        await User.updateOne({refreshToken:token},{$set:{refreshToken:null}})
    }
    res.clearCookie("refreshToken");
    res.json({message:"logout success"})
}

// Google OAuth callback
exports.googleCallback = async(req, res)=>{
    try {
        const user = req.user;
        
        const accessToken = jwt.sign(
            { id: user._id },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        user.refreshToken = refreshToken;
        await user.save();

        // Set cả refreshToken và accessToken vào cookie (an toàn hơn)
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.cookie('accessToken', accessToken, {
            httpOnly: false, // Frontend cần đọc được
            secure: false,
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000, // 15 phút
        });

        // Lưu user info vào cookie (tạm thời để transfer)
        const userInfo = JSON.stringify({
            _id: user._id,
            name: user.name,
            email: user.email,
            isVerified: user.isVerified,
            role: user.role
        });
        
        res.cookie('tempUserInfo', userInfo, {
            httpOnly: false,
            secure: false,
            sameSite: 'lax',
            maxAge: 10 * 1000, // 10 giây - chỉ để chuyển data
        });
        
        // Redirect không có token trên URL
        res.redirect(`${process.env.FRONTEND_URL}/callback`);
    } catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
    }
}

// Get current user profile
exports.getProfile = async(req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password -refreshToken');
        
        if(!user) return res.status(404).json({message: "User not found"});
        
        res.json({user});
    } catch (error) {
        res.status(500).json({message: "Server error", error: error.message});
    }
}

// Get all users (Admin only)
exports.getAllUsers = async(req, res) => {
    try {
        const users = await User.find().select('-password -refreshToken');
        res.json({users});
    } catch (error) {
        res.status(500).json({message: "Server error", error: error.message});
    }
}

// Update user role (Admin only)
exports.updateUserRole = async(req, res) => {
    try {
        const {userId, role} = req.body;
        
        if(!['user', 'admin'].includes(role)) {
            return res.status(400).json({message: "Invalid role. Must be 'user' or 'admin'"});
        }
        
        const user = await User.findByIdAndUpdate(
            userId,
            {role},
            {new: true}
        ).select('-password -refreshToken');
        
        if(!user) return res.status(404).json({message: "User not found"});
        
        res.json({message: "User role updated successfully", user});
    } catch (error) {
        res.status(500).json({message: "Server error", error: error.message});
    }
}

// Delete user (Admin only)
exports.deleteUser = async(req, res) => {
    try {
        const {userId} = req.params;
        
        const user = await User.findByIdAndDelete(userId);
        
        if(!user) return res.status(404).json({message: "User not found"});
        
        res.json({message: "User deleted successfully"});
    } catch (error) {
        res.status(500).json({message: "Server error", error: error.message});
    }
}