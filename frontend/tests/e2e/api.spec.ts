import { test, expect } from '@playwright/test'

test.describe('API Endpoints', () => {
  test.describe('ElevenLabs Signed URL', () => {
    test('should return signed URL for valid scenario', async ({ request }) => {
      const response = await request.post('/api/elevenlabs/signed-url', {
        data: { scenarioType: 'coffee' },
      })

      expect(response.status()).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty('signedUrl')
      expect(data).toHaveProperty('conversationId')
      expect(data).toHaveProperty('scenario')
      // Prompts stay on the server
      expect(data.scenario).not.toHaveProperty('systemPrompt')
    })

    test('should require sign-in', async ({ playwright }) => {
      const anonymous = await playwright.request.newContext({ baseURL: 'http://localhost:3000' })
      const response = await anonymous.post('/api/elevenlabs/signed-url', {
        data: { scenarioType: 'coffee' },
      })

      expect(response.status()).toBe(401)
      await anonymous.dispose()
    })

    test('should return error for missing scenarioType', async ({ request }) => {
      const response = await request.post('/api/elevenlabs/signed-url', {
        data: {},
      })

      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data).toHaveProperty('error')
    })

    test('should return error for invalid scenario', async ({ request }) => {
      const response = await request.post('/api/elevenlabs/signed-url', {
        data: { scenarioType: 'invalid-scenario' },
      })

      expect(response.status()).toBe(404)

      const data = await response.json()
      expect(data.error).toContain('Scenario not found')
    })

    test('should work for all valid scenarios', async ({ request }) => {
      const scenarios = ['coffee', 'bar', 'restaurant', 'transit', 'street']

      for (const scenarioType of scenarios) {
        const response = await request.post('/api/elevenlabs/signed-url', {
          data: { scenarioType },
        })

        expect(response.status()).toBe(200)

        const data = await response.json()
        expect(data).toHaveProperty('signedUrl')
      }
    })
  })

  test.describe('Conversations API', () => {
    let createdConversationId: string

    test('should create a new conversation', async ({ request }) => {
      const response = await request.post('/api/conversations', {
        data: {
          scenarioType: 'coffee',
          startedAt: new Date().toISOString(),
        },
      })

      // API returns 201 for created resources
      expect(response.status()).toBe(201)

      const data = await response.json()
      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('scenarioType', 'coffee')

      createdConversationId = data.id
    })

    test('should get all conversations', async ({ request }) => {
      const response = await request.get('/api/conversations')

      expect(response.status()).toBe(200)

      const data = await response.json()
      // API returns { conversations: [...] }
      expect(data).toHaveProperty('conversations')
      expect(Array.isArray(data.conversations)).toBe(true)
    })

    test('should get a specific conversation', async ({ request }) => {
      // First create a conversation
      const createResponse = await request.post('/api/conversations', {
        data: {
          scenarioType: 'bar',
          startedAt: new Date().toISOString(),
        },
      })

      const created = await createResponse.json()

      // Then get it by ID
      const response = await request.get(`/api/conversations/${created.id}`)

      expect(response.status()).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty('id', created.id)
      expect(data).toHaveProperty('scenarioType', 'bar')
    })

    test('should update a conversation', async ({ request }) => {
      // First create a conversation
      const createResponse = await request.post('/api/conversations', {
        data: {
          scenarioType: 'transit',
          startedAt: new Date().toISOString(),
        },
      })

      const created = await createResponse.json()

      // Then update it
      const response = await request.put(`/api/conversations/${created.id}`, {
        data: {
          endedAt: new Date().toISOString(),
          duration: 120,
          messages: [
            { speaker: 'user', content: 'Hello', timestamp: 0 },
            { speaker: 'ai', content: 'Hi there!', timestamp: 2 },
          ],
        },
      })

      expect(response.status()).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty('duration', 120)
      expect(data.messages).toHaveLength(2)
    })

    test('should return 404 for non-existent conversation', async ({ request }) => {
      const response = await request.get('/api/conversations/non-existent-id')

      expect(response.status()).toBe(404)
    })
  })

  test.describe('Feedback API', () => {
    test('should generate feedback for a conversation', async ({ request }) => {
      // First create a conversation with messages
      const createResponse = await request.post('/api/conversations', {
        data: {
          scenarioType: 'coffee',
          startedAt: new Date().toISOString(),
        },
      })

      const created = await createResponse.json()

      // Update with messages
      await request.put(`/api/conversations/${created.id}`, {
        data: {
          endedAt: new Date().toISOString(),
          duration: 60,
          messages: [
            { speaker: 'user', content: 'Hey, I noticed you were sitting alone', timestamp: 0 },
            { speaker: 'ai', content: 'Oh hi! Yeah, just waiting for a friend', timestamp: 3 },
          ],
        },
      })

      // Generate feedback
      const response = await request.post('/api/feedback', {
        data: {
          conversationId: created.id,
          transcript: [
            { speaker: 'You', content: 'Hey, I noticed you were sitting alone' },
            { speaker: 'Jessica', content: 'Oh hi! Yeah, just waiting for a friend' },
          ],
          scenarioType: 'coffee',
        },
      })

      // Feedback generation might take a moment or might return immediately
      // Accept 200 (success) or 202 (accepted/processing)
      expect([200, 202]).toContain(response.status())
    })
  })
})
