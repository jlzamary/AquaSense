# Migration Guide: Updating Existing Projects for Collaboration

## The Problem

Your existing projects were created with a `userId` field, but the new collaborative features use `ownerId` and `members` fields. This is why you're not seeing the "Manage Members" button on your project cards.

The "Manage Members" button only shows when `project.ownerId === currentUser.uid`, but your old projects have `userId` instead of `ownerId`.

## Solution Options

### Option 1: Manual Update via Firebase Console (Recommended for Few Projects)

1. Go to https://console.firebase.google.com/
2. Select your project: `benthic-ai`
3. Navigate to **Firestore Database** in the left sidebar
4. Click on the **projects** collection
5. For each project document:
   - Click on the document
   - If you see a field called `userId`, click the **three dots menu** → **Add field**
   - Add a new field:
     - Field name: `ownerId`
     - Field type: `string`
     - Field value: (copy the value from `userId`)
   - Add another field:
     - Field name: `members`
     - Field type: `array`
     - Leave it empty (or click **Add item** if you want to pre-add collaborators)
   - (Optional) Delete the old `userId` field
   - Click **Update**

### Option 2: Quick JavaScript Fix in Browser Console

1. Go to your Dashboard page while logged in
2. Open your browser's Developer Tools (F12 or Cmd+Option+I on Mac)
3. Go to the **Console** tab
4. Paste this code and press Enter:

```javascript
const { collection, getDocs, updateDoc, doc } = window.firebase.firestore;
const db = window.firebase.db;

async function migrateProjects() {
  const projectsRef = collection(db, 'projects');
  const snapshot = await getDocs(projectsRef);
  
  let migrated = 0;
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    
    // Check if project needs migration
    if (data.userId && !data.ownerId) {
      await updateDoc(doc(db, 'projects', docSnap.id), {
        ownerId: data.userId,
        members: data.members || []
      });
      console.log(`Migrated project: ${docSnap.id} (${data.name})`);
      migrated++;
    }
  }
  
  console.log(`Migration complete! Updated ${migrated} projects.`);
  alert('Migration complete! Refresh the page to see changes.');
}

migrateProjects().catch(console.error);
```

**Note:** This approach won't work because we can't access the Firebase instance from the browser console in this setup. Use Option 1 or Option 3 instead.

### Option 3: Create a New Project and Test

The simplest way forward:

1. Delete your old project(s) from the Firebase Console (or leave them if you want to keep the data)
2. Go to your Dashboard
3. Click **"Add Project"**
4. Create a new project
5. The new project will have the correct `ownerId` and `members` fields
6. You should now see the **"Manage Members"** button (user plus icon) on the project card

## What to Expect After Migration

Once your projects have both `ownerId` and `members` fields:

1. You'll see a **user plus icon button** on each project card (if you're the owner)
2. Clicking it opens the **"Manage Project Members"** modal
3. In the modal, you can:
   - Enter an email address of another user
   - Click "Add" to add them as a member
   - See the list of current members
   - Remove members by clicking the trash icon
4. Projects shared with you will show a **"Shared"** badge instead of the manage button

## Verification

To verify the migration worked:

1. Refresh your Dashboard page
2. Look for the **user plus icon** (👥+) next to the trash icon on your project cards
3. Click it to open the member management modal
4. Try adding a member by their email address

## If You're Still Having Issues

If the button still doesn't appear after migration:

1. Check the browser console for errors (F12 → Console tab)
2. Verify in Firebase Console that your project has:
   - `ownerId` field (should match your user UID)
   - `members` field (should be an empty array or array of UIDs)
3. Make sure you're logged in as the same user who created the project
4. Try creating a brand new project and see if that one shows the button

## Why This Happened

When we initially built the collaborative features, I updated the code to use `ownerId` and `members`, but your existing Firestore data still had the old `userId` field. The code is checking for `ownerId` but your projects don't have that field yet, so the condition fails and the button doesn't render.

This is a common issue when adding new features to existing applications - you need to migrate the old data to the new schema!

