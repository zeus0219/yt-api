require('dotenv').config();  
const express = require('express');  
const { google } = require('googleapis');  
const cookieSession = require('cookie-session');  

const app = express();  
const PORT = process.env.PORT || 3000;  

// Set up session  
app.use(cookieSession({  
  maxAge: 24 * 60 * 60 * 1000, // 24 hours  
  keys: [process.env.COOKIE_KEY || 'secret_key']  
}));  

// Set up Google OAuth2 client  
const oauth2Client = new google.auth.OAuth2(  
  process.env.GOOGLE_CLIENT_ID,  
  process.env.GOOGLE_CLIENT_SECRET,  
  process.env.GOOGLE_REDIRECT_URI  
);  

// Generate an authentication URL  
const scopes = ['https://www.googleapis.com/auth/youtube.readonly'];  
app.get('/', (req, res) => {  
  const authUrl = oauth2Client.generateAuthUrl({  
    access_type: 'offline',  
    scope: scopes,  
  });  
  res.redirect(authUrl);  
});  

// Handle the callback from Google  
app.get('/auth/google/callback', async (req, res) => {  
  const { code } = req.query;  

  try {  
    const { tokens } = await oauth2Client.getToken(code);  
    oauth2Client.setCredentials(tokens);  
    req.session.tokens = tokens;  

    // Optionally fetch YouTube data here  
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });  
    const response = await youtube.channels.list({  
      mine: true,  
      part: 'snippet,contentDetails',  
    });  

    res.send(response.data);  
  } catch (error) {  
    console.error('Error exchanging code for tokens', error);  
    res.status(500).send('Authentication failed');  
  }  
});  

// Logout  
app.get('/logout', (req, res) => {  
  req.session = null;  
  res.send('You have logged out.');  
});  

// Start the server  
app.listen(PORT, () => {  
  console.log(`Server is running on http://localhost:${PORT}`);  
});