const { randomInt, randomBytes, createHash } = require("crypto");
const User = require("../model/user");
const PendingRegistration = require("../model/pendingRegistration");
const PasswordResetToken = require("../model/passwordResetToken");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const sendEmail = require("../utils/sendEmail");
const { getAccessTokenFromRequest, verifyAccessToken } = require("../middleware/auth");

const OTP_EXPIRES_IN_MINUTES = 10;
const RESET_TOKEN_EXPIRES_IN_MINUTES = 30;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const generateOtp = () => String(randomInt(100000, 1000000));
const generateResetToken = () => randomBytes(32).toString('hex');
const hashToken = (token) => createHash('sha256').update(token).digest('hex');

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
        path: '/',
        maxAge: 7*24*60*60*1000
    })
  const { password: _, refreshToken: __, ...userData} = user._doc;
    console.log('Login userData with role:', userData);
    res.json({message:"Login success",accessToken,user : userData})
}

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(200).json({
            message: "If the account exists, a password reset email has been sent."
        });
    }

    const token = generateResetToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES_IN_MINUTES * 60 * 1000);

    await PasswordResetToken.deleteOne({ email });
    await PasswordResetToken.create({
        email,
        tokenHash,
        expiresAt
    });

    try {
        const resetUrl = `${FRONTEND_URL}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;

        await sendEmail(
            email,
            'Khôi phục mật khẩu',
            `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                    <h2>Khôi phục mật khẩu</h2>
                    <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào nút bên dưới để tiếp tục:</p>
                    <p style="margin: 24px 0;">
                        <a href="${resetUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">
                            Đặt lại mật khẩu
                        </a>
                    </p>
                    <p>Nếu nút không hoạt động, hãy sao chép liên kết sau:</p>
                    <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
                    <p style="margin-top: 16px;">Liên kết sẽ hết hạn sau ${RESET_TOKEN_EXPIRES_IN_MINUTES} phút.</p>
                </div>
            `
        );
    } catch (error) {
        await PasswordResetToken.deleteOne({ email });
        return res.status(500).json({ message: "Failed to send password reset email" });
    }

    return res.status(200).json({
        message: "If the account exists, a password reset email has been sent."
    });
};

exports.resetPassword = async (req, res) => {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
        return res.status(400).json({ message: "Email, token and newPassword are required" });
    }

    const resetRequest = await PasswordResetToken.findOne({ email });

    if (!resetRequest) {
        return res.status(400).json({ message: "Reset token not found or expired" });
    }

    if (resetRequest.expiresAt.getTime() < Date.now()) {
        await PasswordResetToken.deleteOne({ _id: resetRequest._id });
        return res.status(400).json({ message: "Reset token has expired" });
    }

    if (resetRequest.tokenHash !== hashToken(token)) {
        return res.status(400).json({ message: "Invalid reset token" });
    }

    const user = await User.findOne({ email });

    if (!user) {
        await PasswordResetToken.deleteOne({ _id: resetRequest._id });
        return res.status(404).json({ message: "User not found" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.refreshToken = null;
    await user.save();
    await PasswordResetToken.deleteOne({ _id: resetRequest._id });

    return res.json({ message: "Password reset successfully" });
};
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
    res.clearCookie("refreshToken", { path: '/' });
    res.json({message:"logout success"})
}

// Google OAuth callback
exports.googleCallback = async(req, res)=>{
    try {
        const user = req.user;
        const callbackFrontendUrl = req.oauthFrontendUrl || FRONTEND_URL;
        
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
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.cookie('accessToken', accessToken, {
            httpOnly: false, // Frontend cần đọc được
            secure: false,
            sameSite: 'lax',
            path: '/',
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
            path: '/',
            maxAge: 10 * 1000, // 10 giây - chỉ để chuyển data
        });

        res.clearCookie('oauthRedirectOrigin', { path: '/' });
        
        // Redirect không có token trên URL
        res.redirect(`${callbackFrontendUrl}/callback`);
    } catch (error) {
        console.error('Google callback error:', error);
        const callbackFrontendUrl = req.oauthFrontendUrl || FRONTEND_URL;
        res.clearCookie('oauthRedirectOrigin', { path: '/' });
        res.redirect(`${callbackFrontendUrl}/login?error=google_auth_failed`);
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
    const cookieToken = req.cookies?.accessToken;

    if (!token && !cookieToken) {
        return res.status(401).json({ message: "No token" });
    }

    const resolvedToken = token || cookieToken;

    try {
        const decoded = verifyAccessToken(resolvedToken);
        const user = await User.findById(decoded.id).select('-password -refreshToken');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json({
            valid: true,
            user,
            accessToken: resolvedToken,
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