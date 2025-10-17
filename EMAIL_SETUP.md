# Email Notifications Setup Guide

This guide explains how to set up email notifications for AquaSense using Firebase Cloud Functions and SendGrid.

## Overview

We'll implement two types of email notifications:
1. **Welcome Email** - Sent when a user creates an account
2. **Project Invitation Email** - Sent when a user is added to a collaborative project

## Prerequisites

1. Firebase project with Blaze (Pay-as-you-go) plan (required for Cloud Functions)
2. SendGrid account (free tier available: 100 emails/day)
3. Node.js and npm installed locally

## Step 1: Set Up SendGrid

1. **Create a SendGrid Account**
   - Go to https://sendgrid.com/
   - Sign up for a free account (100 emails/day)

2. **Create an API Key**
   - Navigate to Settings → API Keys
   - Click "Create API Key"
   - Choose "Restricted Access" and enable "Mail Send"
   - Copy the API key (you won't be able to see it again!)

3. **Verify Sender Identity**
   - Go to Settings → Sender Authentication
   - Verify a Single Sender (use your email address)
   - Complete the verification process via email

## Step 2: Initialize Firebase Functions

Run these commands in your project root:

```bash
cd /Users/georgebeck/Downloads/Econ_web/AquaSense_FINAL

# Install Firebase CLI globally if you haven't
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Cloud Functions
firebase init functions
```

When prompted:
- Select your existing Firebase project
- Choose JavaScript or TypeScript (JavaScript is simpler)
- Select "Yes" to ESLint
- Select "Yes" to install dependencies

This creates a `functions/` directory in your project.

## Step 3: Install SendGrid in Functions

```bash
cd functions
npm install @sendgrid/mail
cd ..
```

## Step 4: Configure SendGrid API Key

Store your SendGrid API key securely:

```bash
firebase functions:config:set sendgrid.api_key="YOUR_SENDGRID_API_KEY"
sendgrid.from_email="your-verified-email@example.com"
sendgrid.from_name="AquaSense Team"
```

For local development, create `functions/.runtimeconfig.json`:

```json
{
  "sendgrid": {
    "api_key": "YOUR_SENDGRID_API_KEY",
    "from_email": "your-verified-email@example.com",
    "from_name": "AquaSense Team"
  }
}
```

**Important:** Add `functions/.runtimeconfig.json` to `.gitignore`!

## Step 5: Cloud Functions Code

Replace the contents of `functions/index.js` with the following:

```javascript
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

admin.initializeApp();

// Initialize SendGrid
const sendgridConfig = functions.config().sendgrid || {};
sgMail.setApiKey(sendgridConfig.api_key);

const FROM_EMAIL = sendgridConfig.from_email || "noreply@yourdomain.com";
const FROM_NAME = sendgridConfig.from_name || "AquaSense Team";

/**
 * Send welcome email when a new user is created in the users collection
 */
exports.sendWelcomeEmail = functions.firestore
    .document("users/{userId}")
    .onCreate(async (snap, context) => {
      const userData = snap.data();
      const userEmail = userData.email;
      const displayName = userData.displayName || "there";

      const msg = {
        to: userEmail,
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME,
        },
        subject: "Welcome to AquaSense! 🌊",
        text: `Hi ${displayName},

Welcome to AquaSense - your AI-powered platform for benthic species identification!

We're excited to have you on board. Here's what you can do:

✓ Upload and analyze marine images with AI
✓ Create and manage research projects
✓ Collaborate with other researchers
✓ View detailed metrics and analytics

Get started by visiting your dashboard and creating your first project.

If you have any questions, feel free to reach out to our support team.

Best regards,
The AquaSense Team`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0080e6 0%, #004d8c 100%); 
              color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #0080e6; color: white; 
              padding: 12px 24px; text-decoration: none; border-radius: 5px; 
              margin: 20px 0; }
    .features { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .feature { margin: 10px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to AquaSense! 🌊</h1>
    </div>
    <div class="content">
      <p>Hi ${displayName},</p>
      
      <p>Welcome to <strong>AquaSense</strong> - your AI-powered platform for benthic species identification!</p>
      
      <p>We're excited to have you on board. Here's what you can do:</p>
      
      <div class="features">
        <div class="feature">✓ <strong>Upload and analyze</strong> marine images with AI</div>
        <div class="feature">✓ <strong>Create and manage</strong> research projects</div>
        <div class="feature">✓ <strong>Collaborate</strong> with other researchers</div>
        <div class="feature">✓ <strong>View detailed</strong> metrics and analytics</div>
      </div>
      
      <center>
        <a href="https://your-app-url.vercel.app/dashboard" class="button">
          Go to Dashboard
        </a>
      </center>
      
      <p>If you have any questions, feel free to reach out to our support team.</p>
      
      <p>Best regards,<br>The AquaSense Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to ${userEmail}</p>
      <p>© 2025 AquaSense. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
        `,
      };

      try {
        await sgMail.send(msg);
        console.log(`Welcome email sent to ${userEmail}`);
        return null;
      } catch (error) {
        console.error("Error sending welcome email:", error);
        if (error.response) {
          console.error(error.response.body);
        }
        // Don't throw - we don't want to fail user creation if email fails
        return null;
      }
    });

/**
 * Send notification when a user is added to a project's members array
 */
exports.sendProjectInvitationEmail = functions.firestore
    .document("projects/{projectId}")
    .onUpdate(async (change, context) => {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      const projectId = context.params.projectId;

      // Check if members array has changed
      const beforeMembers = beforeData.members || [];
      const afterMembers = afterData.members || [];

      // Find newly added members
      const newMembers = afterMembers.filter((m) => !beforeMembers.includes(m));

      if (newMembers.length === 0) {
        return null;
      }

      // Get project owner info
      const ownerDoc = await admin.firestore()
          .collection("users")
          .doc(afterData.ownerId)
          .get();
      const ownerName = ownerDoc.exists ?
        ownerDoc.data().displayName : "A researcher";

      // Send email to each new member
      const emailPromises = newMembers.map(async (memberId) => {
        try {
          // Get member's email
          const memberDoc = await admin.firestore()
              .collection("users")
              .doc(memberId)
              .get();

          if (!memberDoc.exists) {
            console.log(`User ${memberId} not found`);
            return;
          }

          const memberData = memberDoc.data();
          const memberEmail = memberData.email;
          const memberName = memberData.displayName || "there";

          const projectName = afterData.name || "Untitled Project";
          const projectDescription = afterData.description ||
            "No description provided";

          const msg = {
            to: memberEmail,
            from: {
              email: FROM_EMAIL,
              name: FROM_NAME,
            },
            subject: `You've been added to "${projectName}" on AquaSense 🎉`,
            text: `Hi ${memberName},

${ownerName} has invited you to collaborate on a project!

Project: ${projectName}
Description: ${projectDescription}

You can now:
• View and upload images to this project
• See analyses from all project members
• Access shared metrics and statistics

Login to AquaSense to start collaborating.

Best regards,
The AquaSense Team`,
            html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0080e6 0%, #004d8c 100%); 
              color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #0080e6; color: white; 
              padding: 12px 24px; text-decoration: none; border-radius: 5px; 
              margin: 20px 0; }
    .project-info { background: white; padding: 20px; border-radius: 5px; 
                    margin: 20px 0; border-left: 4px solid #0080e6; }
    .features { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .feature { margin: 10px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Project Invitation 🎉</h1>
    </div>
    <div class="content">
      <p>Hi ${memberName},</p>
      
      <p><strong>${ownerName}</strong> has invited you to collaborate on a project!</p>
      
      <div class="project-info">
        <h3 style="margin-top: 0;">📁 ${projectName}</h3>
        <p style="color: #666;">${projectDescription}</p>
      </div>
      
      <p>You can now:</p>
      
      <div class="features">
        <div class="feature">✓ View and upload images to this project</div>
        <div class="feature">✓ See analyses from all project members</div>
        <div class="feature">✓ Access shared metrics and statistics</div>
      </div>
      
      <center>
        <a href="https://your-app-url.vercel.app/dashboard" class="button">
          View Project
        </a>
      </center>
      
      <p>Best regards,<br>The AquaSense Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to ${memberEmail}</p>
      <p>© 2025 AquaSense. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
            `,
          };

          await sgMail.send(msg);
          console.log(`Project invitation email sent to ${memberEmail}`);
        } catch (error) {
          console.error(`Error sending email to ${memberId}:`, error);
          if (error.response) {
            console.error(error.response.body);
          }
        }
      });

      await Promise.all(emailPromises);
      return null;
    });
```

## Step 6: Update .gitignore

Add these lines to your `.gitignore`:

```
# Firebase Functions
functions/node_modules/
functions/.runtimeconfig.json
functions/lib/
```

## Step 7: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

This will deploy both functions:
- `sendWelcomeEmail` - Triggered when a user document is created
- `sendProjectInvitationEmail` - Triggered when a project's members array is updated

## Step 8: Update Email URLs

Before deploying, update the URLs in the email templates:
1. Replace `https://your-app-url.vercel.app` with your actual Vercel URL
2. Update `FROM_EMAIL` with your verified SendGrid sender email

## Testing

1. **Test Welcome Email:**
   - Create a new user account
   - Check the email inbox for the welcome email

2. **Test Project Invitation:**
   - Add a user to a project via the "Share" button
   - Check the invited user's email inbox

## Monitoring

View function logs in Firebase Console:
- Go to Firebase Console → Functions
- Click on a function to see its logs
- Check for any errors or successful sends

## Cost Considerations

- **SendGrid Free Tier:** 100 emails/day (sufficient for most startups)
- **Firebase Cloud Functions:** Free tier includes 2M invocations/month
- **Firebase Blaze Plan:** Pay-as-you-go, but very affordable for email functions

## Troubleshooting

### Emails not sending?

1. **Check SendGrid API Key:**
   ```bash
   firebase functions:config:get
   ```

2. **Check Function Logs:**
   ```bash
   firebase functions:log
   ```

3. **Verify Sender Email:** Ensure your sender email is verified in SendGrid

4. **Check Spam Folder:** Gmail/Outlook might filter these emails

### Common Issues:

- **"The from address does not match a verified Sender Identity"**
  - Verify your sender email in SendGrid

- **"Insufficient permissions"**
  - Ensure Firebase is on the Blaze plan
  - Check Firestore security rules

- **Function not triggering**
  - Check that the `users` collection documents are being created
  - Verify the function is deployed: `firebase functions:list`

## Alternative: Using Nodemailer (SMTP)

If you prefer to use your own SMTP server instead of SendGrid:

```bash
cd functions
npm install nodemailer
```

Update the functions code to use Nodemailer with your SMTP credentials.

## Security Best Practices

1. ✅ Never commit API keys to Git
2. ✅ Use Firebase environment config for secrets
3. ✅ Set up `.runtimeconfig.json` in `.gitignore`
4. ✅ Use verified sender identities
5. ✅ Implement rate limiting if needed

## Next Steps

Consider adding:
- Unsubscribe links
- Email templates for other events (project removed, etc.)
- HTML email template library (MJML, Foundation for Emails)
- Analytics tracking (open rates, click rates)

---

**Need Help?** Check out:
- [Firebase Cloud Functions Docs](https://firebase.google.com/docs/functions)
- [SendGrid API Docs](https://docs.sendgrid.com/)
- [Nodemailer Docs](https://nodemailer.com/)

