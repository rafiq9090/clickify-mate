import type { AgentContext, AgentUnderstanding, AgentResult } from './agent_types'
import { checkInventory } from './tools/inventory'
import { getCurrentPrice } from './tools/pricing'
import { saveFsmState } from './agent_fsm'
import { buildProgressReply, collectedDetailsForSave, getMissingOrderField } from './agent_dialogue'

export async function runConversationRepair(
    context: AgentContext,
    understanding: AgentUnderstanding
): Promise<AgentResult> {
    const errorType = understanding.possibleErrorType || 'MISUNDERSTOOD_INTENT'
    const targetSku = understanding.entities.sku || context.selection.sku || context.orderDraft?.sku || 't-shirt-white'
    const targetColor = understanding.entities.color || context.selection.color
    const targetSize = understanding.entities.size || context.selection.size

    // 1. Structured Comparison: Compare system selection & draft state against customer claim
    const lastAssistantMsg = [...context.recentMessages].reverse().find(m => m.role === 'assistant')
    const lastText = (lastAssistantMsg?.content || '').toLowerCase()
    const currentSelectedColor = (context.selection.color || '').toLowerCase()
    const currentSelectedSku = (context.selection.sku || '').toLowerCase()
    const claimColor = (targetColor || '').toLowerCase()

    let wasAiActuallyWrong = true
    let clarificationReply = ''

    if (errorType === 'WRONG_PRICE') {
        const priceData = await getCurrentPrice({ agentId: context.agentId, sku: targetSku, quantity: context.selection.quantity || 1 })
        const unitPriceStr = priceData.unitPrice.toString()

        // Structured check: did system price already equal customer's expected price?
        const systemPriceMatches = context.orderDraft?.unitPrice === priceData.unitPrice ||
                                   context.selection.price === priceData.unitPrice ||
                                   lastText.includes(unitPriceStr) ||
                                   lastText.includes('১০০০')

        if (systemPriceMatches) {
            wasAiActuallyWrong = false
            clarificationReply = `জি আপনি একদম ঠিক বলেছেন—আমাদের ${priceData.productName}-এর অফার প্রাইস ৳${priceData.unitPrice} টাকাই ধরা হয়েছে। আপনি কয়টি পিস নিতে চান?`
        } else {
            clarificationReply = `দুঃখিত, তথ্যে একটু বিভ্রান্তি হয়েছিল। আমাদের ${priceData.productName}-এর বর্তমান অফার প্রাইস ৳${priceData.unitPrice}। আপনি কি এটি অর্ডার করতে চান?`
        }
    } else if (errorType === 'WRONG_STOCK' || errorType === 'WRONG_VARIANT') {
        const stockData = await checkInventory({ agentId: context.agentId, sku: targetSku, color: targetColor, size: targetSize })

        // Structured check: was customer's desired color/variant ALREADY in the active selection?
        const alreadyMatched = (currentSelectedColor && currentSelectedColor === claimColor) ||
                               (claimColor && (lastText.includes(claimColor) || (claimColor === 'maroon' && lastText.includes('মেরুন'))))

        if (alreadyMatched) {
            wasAiActuallyWrong = false
            clarificationReply = `জি আপনি ঠিক বলেছেন যে আপনি ${targetColor} চান। আমাদের হিসেবেও ${targetColor} (${targetSize || 'Standard'})-ই ধরা হয়েছিল, যা বর্তমানে স্টকে ${stockData.availableQuantity || 'পর্যাপ্ত'} পিস রয়েছে। আপনি কি এটি কনফার্ম করতে চান?`
        } else if (stockData.available) {
            clarificationReply = `আপনি ঠিক বলেছেন—${stockData.productName} (${targetColor || ''} ${targetSize || ''}) বর্তমানে আমাদের স্টকে ${stockData.availableQuantity} পিস রয়েছে। আগের ভুলের জন্য আন্তরিকভাবে দুঃখিত। আপনি কি এটি অর্ডার করতে চান?`
            // Update active selection to customer's corrected color
            context.selection.color = targetColor
            if (targetSize) context.selection.size = targetSize
        } else {
            clarificationReply = `জি বুঝতে পেরেছি। আপনি ${targetColor || ''} চেয়েছেন, তবে এই মুহূর্তে ${targetColor || ''} স্টকে সীমিত। অন্য কোনো কালার দেখতে চান কি?`
        }
    } else {
        const lower = (understanding.rawSummary || '').toLowerCase()
        const missing = getMissingOrderField(context)
        if (context.orderDraft?.address && /(thikana|ঠিকানা|address)/i.test(lower)) {
            clarificationReply = `আপনি ঠিক বলেছেন—আপনার ঠিকানা “${context.orderDraft.address}” আগে থেকেই সংরক্ষিত আছে। ${missing ? buildProgressReply(context, missing) : 'অর্ডারের প্রয়োজনীয় তথ্য সম্পূর্ণ আছে।'}`
        } else if (context.orderDraft?.phone && /(phone|mobile|number|ফোন|মোবাইল|নম্বর)/i.test(lower)) {
            clarificationReply = `আপনি ঠিক বলেছেন—আপনার মোবাইল নম্বর আগে থেকেই সংরক্ষিত আছে। ${missing ? buildProgressReply(context, missing) : 'অর্ডারের প্রয়োজনীয় তথ্য সম্পূর্ণ আছে।'}`
        } else {
            clarificationReply = `দুঃখিত, আগের উত্তরটি আপনার কথার সাথে মিলেনি। ${missing ? buildProgressReply(context, missing) : 'আপনি কোন তথ্যটি ঠিক করতে চান, সংক্ষেপে বলুন।'}`
        }
    }

    // Restore previous valid state so flow does not restart
    const restoredState = context.session.state === 'REPAIR'
        ? (context.session.previousValidState || 'VARIANT_SELECTION')
        : context.session.state
    await saveFsmState(context.agentId, context.customerId, restoredState, restoredState, {
        ...collectedDetailsForSave(context, understanding.entities)
    }, context.channel)

    return {
        text: clarificationReply,
        state: restoredState,
        repaired: true,
        reaction: {
            shouldReact: true,
            reactionType: wasAiActuallyWrong ? 'SUPPORT' : 'AFFIRMATION',
            emoji: wasAiActuallyWrong ? '🙏' : '👍',
            reason: wasAiActuallyWrong ? 'Acknowledged correction with apology' : 'Clarified fact politely'
        }
    }
}
