const { randomInt } = require("crypto");
const User = require("../model/user");
const PendingRegistration = require("../model/pendingRegistration");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const sendEmail = require("../utils/sendEmail");
const { getAccessTokenFromRequest, verifyAccessToken } = require("../middleware/auth");

const OTP_EXPIRES_IN_MINUTES = 10;

const generateOtp = () => String(randomInt(100000, 1000000));

exports.register = async(req , res)=>{
    const {name , email , password} = req.body;

    if(!name || !email || !password){
        return res.status(400).json({message:"Name, email and password are required"});
    }

    const existingUser = await User.findOne({email});
    if(existingUser) return res.status(400).json({message:"Email already exists"});

    const passwordHash = await bcrypt.hash(password,10);
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000);

    await PendingRegistration.deleteOne({email});
    await PendingRegistration.create({
        name,
        email,
        passwordHash,
        otpHash,
        otpExpiresAt
    });

        try {
                await sendEmail(
                        email,
                        'Xác thực đăng ký bằng OTP',
                        `
                            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                                <h2>Xác thực đăng ký</h2>
                                <p>Mã OTP của bạn là:</p>
                                <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; padding: 12px 16px; background: #f3f4f6; display: inline-block; border-radius: 8px;">
                                    ${otp}
                                </div>
                                <p style="margin-top: 16px;">Mã sẽ hết hạn sau ${OTP_EXPIRES_IN_MINUTES} phút.</p>
                            </div>
                        `
                );
        } catch (error) {
                await PendingRegistration.deleteOne({email});
                return res.status(500).json({message:"Failed to send OTP email"});
        }

    res.status(201).json({
        message:"OTP has been sent to your email. Please verify to complete registration."
    });
}
exports.login = async (req, res)=>{
    const {email , password} = req.body;

    const user = await User.findOne({email});

    if(!user) return res.status(400).json({message:"User not found"});
    if(!user.isVerified) return res.status(403).json({message:"Email is not verified"});

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
const verifyOtp = async(req, res)=>{
    const {email, otp} = req.body;

    if(!email || !otp){
        return res.status(400).json({message:"Email and OTP are required"});
    }

    try {
        const pendingRegistration = await PendingRegistration.findOne({email});

        if(!pendingRegistration){
            return res.status(400).json({message:"OTP request not found or expired"});
        }

        if(pendingRegistration.otpExpiresAt.getTime() < Date.now()){
            await PendingRegistration.deleteOne({_id: pendingRegistration._id});
            return res.status(400).json({message:"OTP has expired. Please register again."});
        }

        const validOtp = await bcrypt.compare(String(otp), pendingRegistration.otpHash);

        if(!validOtp){
            return res.status(400).json({message:"Invalid OTP"});
        }

        const existingUser = await User.findOne({email});
        if(existingUser){
            await PendingRegistration.deleteOne({_id: pendingRegistration._id});
            return res.status(400).json({message:"Email already exists"});
        }

        const user = await User.create({
            name: pendingRegistration.name,
            email: pendingRegistration.email,
            password: pendingRegistration.passwordHash,
            isVerified: true
        });

        await PendingRegistration.deleteOne({_id: pendingRegistration._id});

        res.status(201).json({message:"OTP verified successfully", user});
    } catch (error) {
        res.status(500).json({message:"Server error"})
    }
}

exports.verifyOtp = verifyOtp;
exports.verifyEmail = verifyOtp;
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

// Verify access token for API gateway / downstream services
exports.verifyToken = async (req, res) => {
    const token = getAccessTokenFromRequest(req);

    if (!token) {
        return res.status(401).json({ message: "No token" });
    }

    try {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.id).select('-password -refreshToken');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json({
            valid: true,
            user,
        });
    } catch (error) {
        return res.status(403).json({ message: "Invalid token" });
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