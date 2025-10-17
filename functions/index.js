const {onDocumentCreated, onDocumentUpdated} = require("firebase-functions/v2/firestore");
const {setGlobalOptions} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

// Set global options for all functions
setGlobalOptions({maxInstances: 10});

admin.initializeApp();

// Initialize SendGrid - API key should be set via environment variables
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@aquasense.app";
const FROM_NAME = process.env.FROM_NAME || "AquaSense Team";
const APP_URL = "https://aqua-sense-final.vercel.app";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.warn("SENDGRID_API_KEY not set - emails will not be sent");
}

/**
 * Send welcome email when a new user is created in the users collection
 */
exports.sendWelcomeEmail = onDocumentCreated("users/{userId}", async (event) => {
      const snap = event.data;
      if (!snap) {
        console.log("No data associated with the event");
        return;
      }
      
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
        <a href="${APP_URL}/dashboard" class="button">
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
exports.sendProjectInvitationEmail = onDocumentUpdated("projects/{projectId}", async (event) => {
      const change = event.data;
      if (!change) {
        console.log("No data associated with the event");
        return;
      }
      
      const beforeData = change.before.data();
      const afterData = change.after.data();
      const projectId = event.params.projectId;

      console.log(`Project ${projectId} updated`);

      // Check if members array has changed
      const beforeMembers = beforeData.members || [];
      const afterMembers = afterData.members || [];

      console.log(`Before members: ${JSON.stringify(beforeMembers)}`);
      console.log(`After members: ${JSON.stringify(afterMembers)}`);

      // Find newly added members
      const newMembers = afterMembers.filter((m) => !beforeMembers.includes(m));

      console.log(`New members found: ${JSON.stringify(newMembers)}`);

      if (newMembers.length === 0) {
        console.log("No new members to notify");
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
        <a href="${APP_URL}/dashboard" class="button">
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

          console.log(`Attempting to send email to ${memberEmail}...`);
          await sgMail.send(msg);
          console.log(`✓ Project invitation email sent to ${memberEmail}`);
        } catch (error) {
          console.error(`✗ Error sending email to ${memberId}:`, error);
          if (error.response) {
            console.error("SendGrid error details:", error.response.body);
          }
        }
      });

      await Promise.all(emailPromises);
      return null;
    });

