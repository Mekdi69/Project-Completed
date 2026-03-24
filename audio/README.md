# Audio Files for Water Quest

This directory contains game sound effects downloaded from Mixkit (free sound library).

## Files in Use

1. `water-collect.mp3` - Played when a water item is collected
2. `miss-sound.mp3` - Played when inactivity causes a score penalty (missed collection window)
3. `button-click.mp3` - Played when UI buttons are clicked
4. `win-sound.mp3` - Played when the final win screen appears

## Source Library

- Library: Mixkit free sound effects
- Site: https://mixkit.co/free-sound-effects/

## Direct Clip URLs Used

- Water collect: https://assets.mixkit.co/active_storage/sfx/2364/2364-preview.mp3
- Miss: https://assets.mixkit.co/active_storage/sfx/2042/2042-preview.mp3
- Button click: https://assets.mixkit.co/active_storage/sfx/275/275-preview.mp3
- Win: https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3

## Sound Behavior Notes

- Collect sounds have a short cooldown to avoid overlap spam.
- Button clicks have a short cooldown to prevent duplicate rapid-fire sounds.
- Win sound plays once per completion and resets when the game resets.
- Playback fails silently when browser audio cannot autoplay.
