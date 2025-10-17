# 🚨 CRITICAL: Firebase Security Rules Required

Your images aren't loading because Firebase Security Rules are blocking access. You **MUST** apply these rules now.

## Step 1: Firebase Storage Rules

1. Go to https://console.firebase.google.com/
2. Select your project
3. Click **Storage** in left sidebar
4. Click **Rules** tab
5. **Replace everything** with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload to their own folder
    match /uploads/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow all authenticated users to read any uploaded files
    match /uploads/{allPaths=**} {
      allow read: if request.auth != null;
    }
  }
}
```

6. Click **Publish**

## Step 2: Firestore Database Rules

1. Still in Firebase Console
2. Click **Firestore Database** in left sidebar
3. Click **Rules** tab
4. **Replace everything** with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Projects collection
    match /projects/{projectId} {
      allow read, write: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Analyses collection
    match /analyses/{analysisId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

5. Click **Publish**

## Step 3: Test

After publishing both rules:
1. Refresh your app
2. Go to Projects page and create a project
3. Go to Analysis page and upload images
4. Images should now load properly!

---

**Why this is happening:**
- Firebase blocks all access by default for security
- You need to explicitly allow authenticated users to read/write data
- Without these rules, all Firebase operations fail with "permission denied"
