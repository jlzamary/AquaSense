# Firebase Security Rules Setup

Your application is getting permission errors because Firebase Security Rules need to be configured.

## 1. Firebase Storage Rules

Go to Firebase Console → Storage → Rules and replace with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{userId}/{allPaths=**} {
      // Allow authenticated users to read and write their own files
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow all authenticated users to read any uploaded files
    match /uploads/{allPaths=**} {
      allow read: if request.auth != null;
    }
  }
}
```

## 2. Firestore Database Rules

Go to Firebase Console → Firestore Database → Rules and replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write their own analyses
    match /analyses/{analysisId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

## 3. How to Apply These Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. For **Storage Rules**:
   - Click "Storage" in the left sidebar
   - Click "Rules" tab
   - Paste the Storage rules above
   - Click "Publish"

4. For **Firestore Rules**:
   - Click "Firestore Database" in the left sidebar
   - Click "Rules" tab
   - Paste the Firestore rules above
   - Click "Publish"

## What These Rules Do

**Storage Rules:**
- Users can upload images to their own folder (`uploads/{userId}/`)
- Users can read any uploaded images (needed to view analysis history)
- Prevents unauthorized access

**Firestore Rules:**
- Users can only read their own analysis results
- Users can only create analyses with their own userId
- Users can update/delete their own analyses
- Prevents data leaks between users

## After Applying Rules

Refresh your application and try uploading images again. The permission errors should be resolved!
