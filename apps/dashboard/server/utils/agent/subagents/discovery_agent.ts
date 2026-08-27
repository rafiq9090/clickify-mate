import type { SubAgent, SubAgentInput, SubAgentOutput } from './types'
import { executeToolSafely } from '../agent_tools'
import { buildProductListReply } from '../agent_dialogue'

export class DiscoveryAgent implements SubAgent {
    id = 'discovery' as const
    name = 'Product Discovery & Visual Matching Agent'
    description = 'Specialized in catalog search, variant extraction, image resolution, and product specs.'
    allowedTools = ['search_products', 'get_product_variants', 'resolve_product_images', 'check_inventory']

    canHandle(understanding: any, context: any): boolean {
        const discoveryIntents = [
            'PRODUCT_DISCOVERY',
            'PRODUCT_INFO',
            'IMAGE_REQUEST',
            'STOCK_QUERY',
            'OPTION_SELECTION'
        ]
        return discoveryIntents.includes(understanding.intent)
    }

    async execute(input: SubAgentInput): Promise<SubAgentOutput> {
        const { event, context, understanding } = input
        const lang = context.session.language || 'bn'
        const toolCalls: any[] = []
        const toolResults: any[] = []
        const imagesToSend: string[] = []

        // 1. Image Request Intent
        if (understanding.intent === 'IMAGE_REQUEST') {
            const query = understanding.entities.productName || understanding.entities.sku || event.text || ''
            const toolCallId = `disc_img_${Date.now()}`
            toolCalls.push({ id: toolCallId, name: 'resolve_product_images', arguments: { query, color: understanding.entities.color } })
            
            const executed = await executeToolSafely('resolve_product_images', {
                query,
                sku: understanding.entities.sku,
                color: understanding.entities.color
            }, context)
            
            toolResults.push({ toolCallId, name: 'resolve_product_images', output: executed.data, error: executed.error })

            if (executed.data?.images?.length) {
                imagesToSend.push(...executed.data.images)
                const text = lang === 'en'
                    ? `Here are the photos of ${executed.data.productName || 'the product'}. Which color or size would you like?`
                    : `এই নিন ${executed.data.productName || 'প্রোডাক্টটির'} ছবি। আপনি কোন সাইজ বা কালারটি নিতে আগ্রহী?`
                return {
                    text,
                    state: 'VARIANT_SELECTION',
                    toolCalls,
                    toolResults,
                    imagesToSend,
                    confidence: 0.95
                }
            }
        }

        // 2. Product Variants / Stock Inspection Intent
        if (understanding.entities.sku && (understanding.intent === 'STOCK_QUERY' || understanding.intent === 'PRODUCT_INFO')) {
            const toolCallId = `disc_var_${Date.now()}`
            toolCalls.push({ id: toolCallId, name: 'get_product_variants', arguments: { sku: understanding.entities.sku } })
            
            const executed = await executeToolSafely('get_product_variants', { sku: understanding.entities.sku }, context)
            toolResults.push({ toolCallId, name: 'get_product_variants', output: executed.data, error: executed.error })

            if (executed.data?.variants?.length) {
                const variants = executed.data.variants
                const colors = [...new Set(variants.map((v: any) => v.color).filter(Boolean))].join(', ')
                const sizes = [...new Set(variants.map((v: any) => v.size).filter(Boolean))].join(', ')
                
                const text = lang === 'en'
                    ? `Available options for ${executed.data.productName || understanding.entities.sku}:\n• Colors: ${colors || 'Standard'}\n• Sizes: ${sizes || 'Free Size'}\nWhich combination do you prefer?`
                    : `${executed.data.productName || understanding.entities.sku}-এর জন্য উপলব্ধ ভ্যারিয়েন্ট:\n• কালার: ${colors || 'স্ট্যান্ডার্ড'}\n• সাইজ: ${sizes || 'ফ্রি সাইজ'}\nআপনি কোন কম্বিনেশনটি অর্ডার করতে চান?`
                
                return {
                    text,
                    state: 'VARIANT_SELECTION',
                    toolCalls,
                    toolResults,
                    confidence: 0.95
                }
            }
        }

        // 3. General Product Discovery / Catalog Search Intent
        const query = understanding.entities.productName || event.text || ''
        if (query) {
            const toolCallId = `disc_search_${Date.now()}`
            toolCalls.push({ id: toolCallId, name: 'search_products', arguments: { query } })
            
            const executed = await executeToolSafely('search_products', { query }, context)
            toolResults.push({ toolCallId, name: 'search_products', output: executed.data, error: executed.error })

            if (executed.data?.matches?.length) {
                const list = executed.data.matches.map((p: any, idx: number) => 
                    `${idx + 1}. *${p.name}* (৳${p.price}) - SKU: \`${p.sku}\``
                ).join('\n')

                const text = lang === 'en'
                    ? `Here are our matching items:\n\n${list}\n\nWhich one would you like to see details for?`
                    : `আপনার খোঁজা প্রোডাক্টের তালিকা:\n\n${list}\n\nকোনটির বিস্তারিত দেখতে চান?`

                return {
                    text,
                    state: 'PRODUCT_DISCOVERY',
                    toolCalls,
                    toolResults,
                    confidence: 0.9
                }
            }
        }

        // Fallback: Product List from Dialogue Builder
        const list = buildProductListReply(context)
        context.session.lastPresentedOptions = list.options
        return {
            text: list.text,
            state: 'PRODUCT_DISCOVERY',
            confidence: 0.85
        }
    }
}

export const discoveryAgent = new DiscoveryAgent()
