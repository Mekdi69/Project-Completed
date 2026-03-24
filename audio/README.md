# Audio Files for Water Quest

This directory contains placeholder audio files for the Water Quest game.

## Files Required

1. **water-collect.mp3** - Sound effect played when water is collected
   - Recommended duration: 0.2-0.5 seconds
   - Best format: MP3, 128-256kbps
   - Example: quick "pop" or "water splash" sound

2. **win-sound.mp3** - Sound effect played when the player completes all stages
   - Recommended duration: 1-2 seconds
   - Best format: MP3, 128-256kbps
   - Example: celebratory "victory" or "fanfare" sound

## How to Replace Placeholder Files

1. Get or create your own audio files in MP3 format
2. Replace the existing placeholder files with your audio files
3. Make sure the filenames match exactly:
   - `water-collect.mp3`
   - `win-sound.mp3`
4. Refresh your browser to hear the new sounds

## Sound Management

The game includes sound management features:
- **Collect sounds** have a 100ms cooldown to prevent overlapping
- **Win sound** plays only once per game completion
- All sounds gracefully fail if audio playback is not available
- Works in muted browser tabs (no noise/warnings)
