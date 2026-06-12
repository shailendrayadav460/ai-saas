const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const prisma = require('./database');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/spreadsheets',
      ],
      accessType: 'offline',
      prompt: 'consent',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const avatar = profile.photos?.[0]?.value;

        // Upsert user
        let user = await prisma.user.upsert({
          where: { email },
          update: {
            googleId: profile.id,
            avatar,
            name: profile.displayName,
          },
          create: {
            email,
            name: profile.displayName,
            googleId: profile.id,
            avatar,
            isVerified: true,
          },
        });

        // Return tokens with user so controller can store them
        return done(null, { user, accessToken, refreshToken });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
