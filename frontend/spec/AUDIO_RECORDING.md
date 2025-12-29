# Audio Recording Feature Spec

## Overview
Record full conversation audio (both user and AI) during practice sessions for playback in the review page.

## Current State
- ElevenLabs SDK streams audio but we don't capture it
- Review page shows "Voice recording is available in a future update"
- Transcript (text) is saved and displayed

## Implementation Approach

### 1. Capture AI Audio
The ElevenLabs SDK provides an `onAudio` callback that receives base64-encoded audio chunks:

```typescript
const conversation = await Conversation.startSession({
  signedUrl,
  onAudio: (base64Audio: string) => {
    // Collect AI audio chunks
    aiAudioChunks.push(base64Audio)
  },
  // ... other callbacks
})
```

### 2. Capture User Audio
Use the Web MediaRecorder API to capture user microphone input:

```typescript
const mediaRecorder = new MediaRecorder(microphoneStream)
const userAudioChunks: Blob[] = []

mediaRecorder.ondataavailable = (event) => {
  userAudioChunks.push(event.data)
}

mediaRecorder.start(100) // Capture in 100ms chunks
```

### 3. Combine Audio Streams
Options for combining:
- **Client-side**: Use Web Audio API to merge streams in real-time or post-processing
- **Server-side**: Send both streams to API, use ffmpeg to merge

### 4. Storage Options

| Option | Pros | Cons |
|--------|------|------|
| Base64 in PostgreSQL | Simple, no extra setup | Large DB size, slow queries |
| Local file storage | Simple, fast | Not scalable, lost on redeploy |
| Cloudflare R2 / S3 | Scalable, CDN-ready | Requires setup, costs |
| Supabase Storage | Integrates with planned DB migration | Requires Supabase setup |

**Recommended**: Start with local file storage for development, migrate to Supabase Storage when migrating the database.

## Technical Details

### Audio Format
- ElevenLabs outputs: PCM or uLaw format (configurable)
- MediaRecorder outputs: WebM/Opus or WAV
- Final output: MP3 or WebM for broad browser support

### File Structure
```
/public/recordings/
  └── {conversationId}.webm
```

Or with cloud storage:
```
https://storage.example.com/recordings/{conversationId}.webm
```

### Database Changes
The `Conversation` model already has an `audioUrl` field:
```prisma
model Conversation {
  audioUrl String?  // URL to the recording file
}
```

### API Changes
1. New endpoint `POST /api/recordings/upload` to handle audio upload
2. Update `PUT /api/conversations/{id}` to accept audio file or URL

## Implementation Steps

1. **Phase 1: Capture**
   - Add `onAudio` handler to collect AI audio chunks
   - Add MediaRecorder for user audio
   - Store chunks in refs during conversation

2. **Phase 2: Process**
   - On conversation end, combine audio chunks
   - Convert to final format (WebM recommended)
   - Create downloadable blob

3. **Phase 3: Store**
   - Upload to storage (local or cloud)
   - Save URL to conversation record

4. **Phase 4: Playback**
   - Update review page to use audio URL
   - Add playback controls with progress sync to transcript

## Considerations

### Performance
- Audio chunks should be collected efficiently to avoid memory issues
- Consider streaming upload for long conversations

### Privacy
- Audio contains user voice data
- Need clear data retention policy
- Consider auto-deletion after X days

### Browser Support
- MediaRecorder: Chrome, Firefox, Safari 14.1+, Edge
- Web Audio API: Broad support

## Estimated Effort
- Phase 1-2: 4-6 hours
- Phase 3 (local storage): 2 hours
- Phase 3 (cloud storage): 4-6 hours
- Phase 4: 2 hours

## Future Enhancements
- Waveform visualization during playback
- Highlight transcript as audio plays
- Export conversation as video with avatar animation
