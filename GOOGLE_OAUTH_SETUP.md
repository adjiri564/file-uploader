# Google OAuth Setup Instructions

To enable Google OAuth authentication in your File Uploader application, follow these steps:

## 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (or Google Identity API)

## 2. Create OAuth 2.0 Credentials

1. In the Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application** as the application type
4. Add the following to **Authorized redirect URIs**:
   - `http://localhost:3000/auth/google/callback` (for development)
   - `https://yourdomain.com/auth/google/callback` (for production)

## 3. Configure Environment Variables

Add the following variables to your `.env` file:

```env
GOOGLE_CLIENT_ID="your-google-client-id-here"
GOOGLE_CLIENT_SECRET="your-google-client-secret-here"
```

Replace the placeholder values with the actual Client ID and Client Secret from your Google Cloud Console.

## 4. Restart the Server

After adding the environment variables, restart your server:

```bash
npm start
# or
node server.js
```

## 5. Test the Integration

1. Visit `http://localhost:3000/login` or `http://localhost:3000/register`
2. You should see "Sign in with Google" or "Sign up with Google" buttons
3. Click the button to test the OAuth flow

## Features

- **Automatic Account Creation**: New users are automatically created when they sign in with Google
- **Account Linking**: Existing users can link their Google account to their existing account
- **Profile Information**: Google profile picture and display name are automatically imported
- **Seamless Integration**: Works alongside traditional email/password authentication

## Security Notes

- Keep your Google Client Secret secure and never commit it to version control
- Use HTTPS in production
- Regularly rotate your OAuth credentials
- Monitor OAuth usage in the Google Cloud Console

## Troubleshooting

- **"OAuth2Strategy requires a clientID option"**: Make sure your environment variables are set correctly
- **"redirect_uri_mismatch"**: Verify your redirect URI in Google Cloud Console matches your callback URL
- **"access_denied"**: Check that the Google+ API is enabled in your project
