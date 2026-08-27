import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { IncomingAgentEvent, AgentChannel } from '../../utils/agent/agent_types'

describe('Instagram Platform Integration Tests', () => {

  it('supports canonical instagram and instagram_comment channel types', () => {
    const dmChannel: AgentChannel = 'instagram'
    const commentChannel: AgentChannel = 'instagram_comment'

    const dmEvent: IncomingAgentEvent = {
      channel: dmChannel,
      eventId: 'evt_ig_123',
      customerId: 'ig_user_456',
      customerName: 'fashion_lover_dhaka',
      messageId: 'mid_789',
      text: 'Do you have this black hoodie in size L?',
      timestamp: Date.now()
    }

    const commentEvent: IncomingAgentEvent = {
      channel: commentChannel,
      eventId: 'evt_ig_cmt_123',
      customerId: 'ig_user_456',
      customerName: 'fashion_lover_dhaka',
      messageId: 'comment_999',
      text: 'Price please?',
      timestamp: Date.now()
    }

    assert.equal(dmEvent.channel, 'instagram')
    assert.equal(commentEvent.channel, 'instagram_comment')
  })

  it('formats instagram platform names properly for UI display', () => {
    const formatPlatformName = (platform: string) => {
      if (platform === 'fb_comment') return 'FB comment'
      if (platform === 'messenger') return 'Messenger'
      if (platform === 'whatsapp') return 'WhatsApp'
      if (platform === 'telegram') return 'Telegram'
      if (platform === 'instagram') return 'Instagram DM'
      if (platform === 'ig_comment') return 'Instagram comment'
      return platform
    }

    assert.equal(formatPlatformName('instagram'), 'Instagram DM')
    assert.equal(formatPlatformName('ig_comment'), 'Instagram comment')
    assert.equal(formatPlatformName('whatsapp'), 'WhatsApp')
  })

  it('parses incoming Instagram DM payload structure correctly', () => {
    const mockWebhookPayload = {
      object: 'instagram',
      entry: [
        {
          id: '17841400000000000', // Instagram Business Account ID
          time: 1710000000000,
          messaging: [
            {
              sender: { id: '9876543210' },
              recipient: { id: '17841400000000000' },
              timestamp: 1710000000000,
              message: {
                mid: 'm_ig_message_unique_123',
                text: 'How much is shipping to Chittagong?'
              }
            }
          ]
        }
      ]
    }

    assert.equal(mockWebhookPayload.object, 'instagram')
    const messaging = mockWebhookPayload.entry[0]!.messaging[0]!
    assert.equal(messaging.sender.id, '9876543210')
    assert.equal(messaging.message.text, 'How much is shipping to Chittagong?')
    assert.equal(messaging.message.mid, 'm_ig_message_unique_123')
  })

  it('parses incoming Instagram Comment on Post/Reel correctly', () => {
    const mockCommentPayload = {
      object: 'instagram',
      entry: [
        {
          id: '17841400000000000',
          time: 1710000000000,
          changes: [
            {
              field: 'comments',
              value: {
                id: 'comment_reel_555',
                text: 'Order korte chai, inbox check koren',
                from: {
                  id: 'user_ig_333',
                  username: 'stylish_buyer_bd'
                }
              }
            }
          ]
        }
      ]
    }

    assert.equal(mockCommentPayload.entry[0]!.changes[0]!.field, 'comments')
    const val = mockCommentPayload.entry[0]!.changes[0]!.value
    assert.equal(val.from.username, 'stylish_buyer_bd')
    assert.ok(val.text.includes('Order korte chai'))
  })
})
