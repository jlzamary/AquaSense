# Collaborative Projects Setup Guide

## 🎉 Overview

Your AquaSense application now supports **collaborative projects**! Users can:
- Create projects and invite team members by email
- Share projects with other users
- View all analyses from all team members in a project
- See metrics across the entire team's contributions

---

## 🔧 Required Firebase Configuration

### **CRITICAL: Update Firebase Security Rules**

You **MUST** update your Firebase security rules for this feature to work. Follow these steps:

---

## 📝 Step 1: Update Firestore Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules** tab
4. Replace your existing rules with the following:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - for email lookup
    match /users/{userId} {
      // Anyone authenticated can read user data (for inviting members)
      allow read: if request.auth != null;
      
      // Users can only write their own document
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Projects collection
    match /projects/{projectId} {
      // Users can read if they are the owner OR a member
      allow read: if request.auth != null && 
                    (resource.data.ownerId == request.auth.uid || 
                     request.auth.uid in resource.data.members);
      
      // Users can create new projects
      allow create: if request.auth != null && 
                      request.resource.data.ownerId == request.auth.uid;
      
      // Only the owner can update or delete
      allow update, delete: if request.auth != null && 
                              resource.data.ownerId == request.auth.uid;
    }
    
    // Analyses collection
    match /analyses/{analysisId} {
      // Users can read analyses if they have access to the project
      allow read: if request.auth != null && 
                    (get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.ownerId == request.auth.uid ||
                     request.auth.uid in get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.members);
      
      // Users can create analyses if they have access to the project
      allow create: if request.auth != null && 
                      (get(/databases/$(database)/documents/projects/$(request.resource.data.projectId)).data.ownerId == request.auth.uid ||
                       request.auth.uid in get(/databases/$(database)/documents/projects/$(request.resource.data.projectId)).data.members);
      
      // Users can update/delete their own analyses if they have project access
      allow update, delete: if request.auth != null && 
                              resource.data.userId == request.auth.uid;
    }
  }
}
```

5. Click **Publish** to save the rules

---

## 📁 Step 2: Update Storage Security Rules

1. In Firebase Console, navigate to **Storage** → **Rules** tab
2. Replace your existing rules with:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Uploads directory
    match /uploads/{userId}/{fileName} {
      // Users can read if they own the file OR if they have access to the project
      allow read: if request.auth != null && 
                    (userId == request.auth.uid ||
                     // Check if user has access to any project containing this analysis
                     exists(/databases/$(database)/documents/analyses/$(fileName)) &&
                     (firestore.get(/databases/$(database)/documents/projects/$(firestore.get(/databases/$(database)/documents/analyses/$(fileName)).data.projectId)).data.ownerId == request.auth.uid ||
                      request.auth.uid in firestore.get(/databases/$(database)/documents/projects/$(firestore.get(/databases/$(database)/documents/analyses/$(fileName)).data.projectId)).data.members));
      
      // Users can only write to their own directory
      allow write: if request.auth != null && userId == request.auth.uid;
    }
  }
}
```

3. Click **Publish** to save the rules

---

## 🔄 Step 3: Migrate Existing Projects (IMPORTANT!)

Your existing projects were created with the old schema (`userId` field). You need to migrate them to the new schema.

### Option A: Automatic Migration (Recommended)

When you create a new user or sign in, the app will automatically handle new projects with the correct schema.

### Option B: Manual Migration in Firebase Console

For **existing projects**, you need to manually update them:

1. Go to **Firestore Database** in Firebase Console
2. Open the `projects` collection
3. For **each project document**:
   - **Rename field**: `userId` → `ownerId`
   - **Add new field**: `members` (type: array) with value: `[]` (empty array)

**Before:**
```
{
  "name": "My Project",
  "description": "...",
  "userId": "abc123",
  "createdAt": ...
}
```

**After:**
```
{
  "name": "My Project",
  "description": "...",
  "ownerId": "abc123",
  "members": [],
  "createdAt": ...
}
```

4. Save each document

---

## 🚀 Step 4: Test the Feature

1. **Sign in** to your application
2. **Create a new project** (or migrate an old one as shown above)
3. **Invite a collaborator**:
   - Click the "👤+" (Manage Members) button on a project card
   - Enter their email address (they must have an account)
   - Click "Add"
4. **Have the collaborator sign in**:
   - They should see the project with a "Shared" badge
   - They can upload images to the project
   - They can view all analyses and metrics
5. **Test permissions**:
   - Collaborators can **upload images** and **view data**
   - Only the **owner** can **add/remove members** and **delete the project**

---

## 🎨 What's New in the UI

### **Dashboard**
- **"Shared" badge** on projects you don't own
- **"Manage Members" button** (👤+) for project owners
- **Member count** displayed below project name
- **Member Management Modal**:
  - Add members by email
  - View current members
  - Remove members (owner only)
  - Delete button only visible to owner

### **Analysis Page**
- Can see and upload to shared projects
- All project members see all analyses

### **Metrics Page**
- Shows combined analytics from all team members
- Data aggregated across all collaborators

---

## 🔒 Security Notes

1. **Users collection**: Required for email-based invitations. Contains only public info (email, displayName, uid).
2. **Project access**: Controlled by `ownerId` and `members` array.
3. **Analysis permissions**: Inherited from project permissions.
4. **Storage access**: Files are accessible to all project members.

---

## 🐛 Troubleshooting

### "Missing or insufficient permissions" error

**Cause**: Firebase security rules not updated.

**Solution**: Follow Step 1 and Step 2 above to update Firestore and Storage rules.

---

### Can't find user by email

**Cause**: The user hasn't signed up yet, or their user document wasn't created.

**Solution**: 
- Ensure the user has created an account
- Have them sign out and sign back in (this will create their user document)
- For existing users, they'll get a user document on their next login

---

### Old projects not appearing

**Cause**: Projects still have `userId` field instead of `ownerId`.

**Solution**: Follow Step 3 to migrate existing projects.

---

### Shared projects not loading

**Cause**: Firestore index may be needed for the `members` array query.

**Solution**: 
- Check browser console for index errors
- Click the provided link to create the index automatically
- Or go to Firestore → Indexes and create a composite index:
  - Collection: `projects`
  - Fields: `members` (Arrays) + `createdAt` (Descending)

---

## 📊 Data Model

### Project Document
```typescript
{
  id: string;
  name: string;
  description: string;
  ownerId: string;      // User ID of creator
  members: string[];    // Array of user IDs with access
  createdAt: Timestamp;
}
```

### User Document
```typescript
{
  uid: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
}
```

---

## 🎯 Next Steps

Optional enhancements you could add:
- Email notifications when added to a project
- Project activity log
- Role-based permissions (viewer, editor, admin)
- Project transfer (change owner)
- Invitation links (instead of email-based)

---

**Need help?** Check the console for errors and ensure all Firebase rules are updated correctly!

