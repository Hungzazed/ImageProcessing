const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const User = require("../model/user");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:3000'}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        
        // Tìm user bằng googleId hoặc email
        let user = await User.findOne({ 
          $or: [
            { googleId: profile.id },
            { email: email }
          ]
        });

        if (!user) {
          // Tạo user mới nếu chưa tồn tại
          user = await User.create({
            name: profile.displayName,
            email: email,
            googleId: profile.id,
            isVerified: true,
          });
        } else if (!user.googleId) {
          // Nếu user tồn tại nhưng chưa có googleId, cập nhật googleId
          user.googleId = profile.id;
          user.isVerified = true;
          await user.save();
        }

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
