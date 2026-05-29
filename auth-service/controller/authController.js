const { randomInt, randomBytes, createHash } = require("crypto");
const User = require("../model/user");
const PendingRegistration = require("../model/pendingRegistration");
const PasswordResetToken = require("../model/passwordResetToken");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const sendEmail = require("../utils/sendEmail");
const { enqueueOtpEmail } = require("../utils/otpEmailQueue");
const { getAccessTokenFromRequest, getRefreshTokenFromRequest, verifyAccessToken } = require("../middleware/auth");

const OTP_EXPIRES_IN_MINUTES = 1;
const RESET_TOKEN_EXPIRES_IN_MINUTES = 30;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const generateOtp = () => String(randomInt(100000, 1000000));
const generateResetToken = () => randomBytes(32).toString('hex');
const hashToken = (token) => createHash('sha256').update(token).digest('hex');

exports.register = async(req , res)=>{
    const {name , email , password} = req.body;

    try {
        if(!name || !email || !password){
            return res.status(400).json({message:"Name, email and password are required"});
        }

        const existingUser = await User.findOne({email});
        if(existingUser) return res.status(409).json({message:"Email already exists"});

        const passwordHash = await bcrypt.hash(password,10);
        const otp = generateOtp();
        const otpHash = await bcrypt.hash(otp, 10);
        const otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000);

        await PendingRegistration.deleteOne({email});
        const pendingRegistration = await PendingRegistration.create({
            name,
            email,
            passwordHash,
            otpHash,
            otpExpiresAt,
            emailStatus: 'pending',
            emailAttemptCount: 0,
            lastEmailError: null,
            otpSentAt: null,
        });

        await enqueueOtpEmail({
            pendingRegistrationId: String(pendingRegistration._id),
            email,
            otp,
            otpExpiresInMinutes: OTP_EXPIRES_IN_MINUTES,
        });

        return res.status(201).json({
            message:"OTP is being sent to your email. Please verify to complete registration."
        });
    } catch (error) {
        console.error('register: unexpected error', error && (error.stack || error.message || error));
        try { await PendingRegistration.deleteOne({ email }).catch(()=>{}); } catch(_){}
        return res.status(500).json({ message: 'Server error', error: error && (error.message || String(error)) });
    }
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

    const { password: _, refreshToken: __, ...userData} = user._doc;

    res.json({
        message: "Login success",
        accessToken,
        refreshToken,
        user: userData
    })
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

    const emailTrimmed = String(email).trim().toLowerCase();
    const otpTrimmed = String(otp).trim();

    try {
        const pendingRegistration = await PendingRegistration.findOne({email: emailTrimmed});

        if(!pendingRegistration){
            console.warn(`verifyOtp: pending not found for email=${emailTrimmed}`);
            return res.status(400).json({message:"OTP request not found or expired"});
        }

        if (!pendingRegistration.otpExpiresAt || pendingRegistration.otpExpiresAt.getTime() < Date.now()){
            await PendingRegistration.deleteOne({_id: pendingRegistration._id});
            console.warn(`verifyOtp: otp expired for email=${emailTrimmed}`);
            return res.status(400).json({message:"OTP has expired. Please register again."});
        }

        const validOtp = await bcrypt.compare(otpTrimmed, pendingRegistration.otpHash);

        if(!validOtp){
            console.warn(`verifyOtp: invalid otp for email=${emailTrimmed}`);
            return res.status(400).json({message:"Invalid OTP"});
        }

        const existingUser = await User.findOne({email: emailTrimmed});
        if(existingUser){
            await PendingRegistration.deleteOne({_id: pendingRegistration._id});
            console.warn(`verifyOtp: email already exists when verifying otp email=${emailTrimmed}`);
            return res.status(409).json({message:"Email already exists"});
        }

        try {
            const user = await User.create({
                name: pendingRegistration.name,
                email: emailTrimmed,
                password: pendingRegistration.passwordHash,
                isVerified: true
            });

            await PendingRegistration.deleteOne({_id: pendingRegistration._id});

            return res.status(201).json({message:"OTP verified successfully", user});
        } catch (err) {
            // handle duplicate key race (email unique index) or other create-time errors
            console.error('verifyOtp: user creation failed', err && (err.stack || err.message || err));
            // cleanup pending registration to avoid stale pending entries
            try { await PendingRegistration.deleteOne({_id: pendingRegistration._id}).catch(()=>{}); } catch(_){}
            if (err && err.code === 11000) {
                return res.status(409).json({ message: 'Email already exists' });
            }
            return res.status(500).json({ message: 'Server error' });
        }
    } catch (error) {
        console.error('verifyOtp: unexpected error', error && (error.stack || error.message || error));
        res.status(500).json({message:"Server error"})
    }
}

exports.verifyOtp = verifyOtp;
exports.verifyEmail = verifyOtp;
exports.refreshToken = async(req, res)=>{
    const token = getRefreshTokenFromRequest(req);

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
        res.json({accessToken: newAccessToken, refreshToken: token})
    } catch (error) {
        res.status(403).json({message:"Refresh token expired"})
    }      
}
exports.logout = async(req,res)=>{
    const token = getRefreshTokenFromRequest(req);
    if(token){
        await User.updateOne({refreshToken:token},{$set:{refreshToken:null}})
    }
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

        const userInfo = JSON.stringify({
            _id: user._id,
            name: user.name,
            email: user.email,
            isVerified: user.isVerified,
            role: user.role
        });

        const encodedUser = Buffer.from(userInfo).toString('base64url');
        const redirectUrl = `${callbackFrontendUrl}/callback?accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}&user=${encodeURIComponent(encodedUser)}`;

        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Google callback error:', error);
        const callbackFrontendUrl = req.oauthFrontendUrl || FRONTEND_URL;
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
            accessToken: token,
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