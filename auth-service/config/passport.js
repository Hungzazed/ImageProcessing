const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const User = require("../model/user");
const { ensureUserProfile } = require("../utils/userServiceClient");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] && profile.emails[0].value;

        if (!email) {
          return done(new Error('Google account did not return an email address'), null);
        }

        // Tìm user bằng googleId hoặc email
        let user = await User.findOne({
          $or: [
            { googleId: profile.id },
            { email: email }
          ]
        });

        let shouldEnsureUserProfile = false;

        if (!user) {
          // Tạo user mới nếu chưa tồn tại
          user = await User.create({
            name: profile.displayName,
            email: email,
            googleId: profile.id,
            isVerified: true,
          });
          shouldEnsureUserProfile = true;
        } else if (!user.googleId) {
          // Nếu user tồn tại nhưng chưa có googleId, cập nhật googleId
          user.googleId = profile.id;
          user.isVerified = true;
          await user.save();
          shouldEnsureUserProfile = true;
        }

        if (shouldEnsureUserProfile) {
          try {
            await ensureUserProfile({
              name: user.name || profile.displayName,
              email: user.email || email,
              stableId: user.googleId || profile.id || user._id,
            });
          } catch (profileError) {
            console.error('Google OAuth user-service profile sync failed:', {
              email,
              status: profileError.response && profileError.response.status,
              data: profileError.response && profileError.response.data,
              message: profileError.message,
            });
          }
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
