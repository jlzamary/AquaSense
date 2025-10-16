# How to Delete Old Firestore Documents

Follow these steps to delete the broken analysis documents from Firestore:

## Steps:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `benthic-ai`

2. **Navigate to Firestore Database**
   - In the left sidebar, click on "Firestore Database"
   - You should see your collections

3. **Delete the analyses collection**
   - Click on the `analyses` collection
   - You'll see all the documents with broken image URLs
   
   **Option A - Delete individual documents:**
   - Click on each document
   - Click the three dots menu (⋮) at the top
   - Select "Delete document"
   - Repeat for all documents
   
   **Option B - Delete entire collection (easier):**
   - In the Firebase Console, go to the collection
   - Unfortunately, Firebase Console doesn't have a "delete all" button for collections
   - You'll need to delete documents one by one, OR
   - Use the Firebase CLI (see below)

4. **Alternative: Use Firebase CLI (Recommended for many documents)**
   ```bash
   # Install Firebase CLI if you haven't
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Delete all documents in the analyses collection
   firebase firestore:delete analyses --recursive --yes
   ```

## After Deletion:

Once you've deleted the old documents:
1. Refresh your web application
2. The errors should disappear
3. Try uploading a new image
4. The new uploads will use the correct structure with:
   - `storagePath`: The permanent Firebase Storage path
   - `imageUrl`: The download URL for display
   - No more `/undefined` in URLs!

## What Changed:

The upload code now:
1. Generates unique filenames with timestamps
2. Stores both the storage path and download URL
3. Properly tracks upload progress
4. Validates data before saving to Firestore

Your new uploads will work perfectly! 🎉

