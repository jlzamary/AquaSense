# Background Video Setup Guide

I've updated the Home page to support a beautiful underwater fish video background! Here's how to add your video.

## Quick Setup

### Step 1: Get Your Video

You need an underwater fish swimming video. Here are some options:

**Option A - Free Stock Videos:**
1. Visit [Pexels](https://www.pexels.com/search/videos/underwater%20fish/) or [Pixabay](https://pixabay.com/videos/search/underwater%20fish/)
2. Search for "underwater fish" or "fish swimming"
3. Download a video (MP4 format recommended)
4. Choose a video that's:
   - High quality but not huge (under 10MB ideally)
   - At least 1920x1080 resolution
   - Has smooth, calming movement

**Option B - Create Your Own:**
- Record your own underwater footage
- Use stock footage from your research

### Step 2: Optimize Your Video

**Recommended specs:**
- **Format**: MP4 (H.264 codec)
- **Resolution**: 1920x1080 (1080p)
- **File size**: 5-10MB
- **Duration**: 15-30 seconds (it will loop)

**To compress your video** (if needed):
```bash
# Using ffmpeg (if you have it installed)
ffmpeg -i input.mp4 -vcodec h264 -crf 28 -preset slow underwater-fish.mp4
```

Or use online tools like:
- [CloudConvert](https://cloudconvert.com/mp4-converter)
- [Clipchamp](https://clipchamp.com/)

### Step 3: Add Video to Your Project

1. **Rename your video** to `underwater-fish.mp4`
2. **Place it in the `public` folder**:
   ```
   /Users/georgebeck/Downloads/Econ_web/AquaSense_FINAL/public/underwater-fish.mp4
   ```

3. That's it! The video will automatically load when you visit the home page.

## What I Changed

### Technical Details

**Added to `Home.tsx`:**

```tsx
{/* Background Video */}
<Box
  as="video"
  position="absolute"
  top="0"
  left="0"
  width="100%"
  height="100%"
  objectFit="cover"
  autoPlay
  loop
  muted
  playsInline
  opacity={0.3}
  pointerEvents="none"
>
  <source src="/underwater-fish.mp4" type="video/mp4" />
</Box>

{/* Dark overlay for better text readability */}
<Box
  position="absolute"
  inset={0}
  bg="blackAlpha.400"
  pointerEvents="none"
/>
```

### Key Features:

1. **Auto-play**: Video starts automatically when page loads
2. **Loop**: Plays continuously in the background
3. **Muted**: No audio (required for autoplay in browsers)
4. **Opacity**: Set to 30% so text remains readable
5. **Dark Overlay**: Additional layer to ensure good contrast
6. **Object-fit: cover**: Video fills the entire background
7. **Responsive**: Works on all screen sizes
8. **Mobile-friendly**: `playsInline` attribute for iOS

## Customization

You can adjust these settings in `Home.tsx`:

### Make video more/less visible:
```tsx
opacity={0.5}  // Change from 0.3 to 0.5 for more visible video
```

### Adjust overlay darkness:
```tsx
bg="blackAlpha.600"  // Darker overlay (currently 400)
bg="blackAlpha.200"  // Lighter overlay
```

### Change video source:
```tsx
<source src="/your-video-name.mp4" type="video/mp4" />
```

## Performance Tips

1. **Keep file size under 10MB** - Large files slow down page load
2. **Use MP4 format** - Best browser compatibility
3. **Compress the video** - Use tools mentioned above
4. **Consider WebP format** - For even better compression (optional)

## Fallback

If the video doesn't load:
- The gradient background will still show
- Page remains fully functional
- No error messages to users

## Troubleshooting

### Video doesn't show up:
- Check the file name is exactly: `underwater-fish.mp4`
- Make sure it's in the `public` folder (not `src`)
- Try refreshing the page with Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

### Video is too bright/dark:
- Adjust the `opacity` value (line 58 in Home.tsx)
- Adjust the overlay `bg` value (line 69 in Home.tsx)

### Video doesn't autoplay on mobile:
- This is normal browser behavior for mobile
- The gradient background will show instead
- Video will play on desktop

## Alternative: Multiple Videos

Want different videos? You can add multiple sources:

```tsx
<Box as="video" ...>
  <source src="/underwater-fish.webm" type="video/webm" />
  <source src="/underwater-fish.mp4" type="video/mp4" />
</Box>
```

Browser will use the first format it supports.

## Example Free Videos

Here are some good Pexels videos to try:
- Search: "underwater fish school"
- Search: "coral reef fish"
- Search: "tropical fish swimming"

---

**Remember**: Once you add the video file to the `public` folder and refresh the page, you should see beautiful fish swimming in the background! 🐠🐟🐡


