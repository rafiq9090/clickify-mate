// server/utils/agent/comment_moderator.ts

export interface ModerationResult {
    isBad: boolean
    reason?: string
    category?: 'abuse' | 'scam_defamation' | 'spam_promo' | 'harassment'
    severity?: 'high' | 'medium'
}

/**
 * High-accuracy multi-lingual comment moderation engine for Facebook & Instagram.
 * Detects abusive language, fraud/scam allegations, adult keywords, and spam promotional links.
 */
export function analyzeCommentToxicity(text: string): ModerationResult {
    if (!text || typeof text !== 'string') {
        return { isBad: false }
    }

    const cleanText = text.trim().toLowerCase()

    // 1. Abusive, profane, vulgar, and swearing terms (Bengali, Banglish & English)
    const abusivePatterns = [
        /\b(?:bal|baal|choda|chudi|magi|khanki|kutta|harami|shala|sala|beshya|khankir|madarchod|bhenchod|gandu|bokachoda|chodar|pod|bogol|haramkhor)\b/i,
        /\b(?:fuck|fucking|bitch|bastard|asshole|idiot|stupid|scumbag|motherfucker|whore|cunt|dick|pussy)\b/i,
        /(?:বাল|চোদা|চুদি|মাগী|খানকি|কুত্তা|হারামি|শালা|মাদারচোদ|বেজন্মা|বোকাচোদা|খানকির\s*পোলা|হারামখোর|চুদির\s*ভাই|শুয়োরের\s*বাচ্চা)/i
    ]

    for (const pattern of abusivePatterns) {
        if (pattern.test(cleanText)) {
            return {
                isBad: true,
                category: 'abuse',
                reason: 'Abusive / Profane Language',
                severity: 'high'
            }
        }
    }

    // 2. Fraud, Scam, Cheat & Defamation Accusations against store
    const defamationPatterns = [
        /\b(?:scam|scammer|fraud|fraudster|cheat|cheater|dhoka|dhokabaaj|dhokabaj|chor|chorkom|butpar|batpar|fake\s*product|fake\s*page|fata\s*kapod|nosto\s*mal|batpari|chori)\b/i,
        /(?:প্রতারক|বাটপার|চোর|চিটার|ধোঁকাবাজ|ভুয়া\s*পেজ|জাল\s*প্রোডাক্ট|নষ্ট\s*মাল|ফালতু\s*কোম্পানি|বাটপারি|প্রতারণা|চোর\s*কোম্পানি)/i
    ]

    for (const pattern of defamationPatterns) {
        if (pattern.test(cleanText)) {
            return {
                isBad: true,
                category: 'scam_defamation',
                reason: 'Fraud / Defamation Accusation',
                severity: 'high'
            }
        }
    }

    // 3. Spam links, Casino/Gambling promotions, Illegal betting
    const spamPatterns = [
        /(?:t\.me\/|telegram\.me\/|wa\.me\/|chat\.whatsapp\.com|bit\.ly\/|tinyurl\.com)/i,
        /\b(?:1xbet|melbet|babu88|jeetbuzz|baji\s*live|crazy\s*time|casino|betting|free\s*giveaway|earning\s*app|lottery)\b/i,
        /(?:অনলাইন\s*ইনকাম|ঘরে\s*বসে\s*আয়|বাজি\s*লাইভ|ফ্রি\s*টাকা|জুয়া|ক্যাসিনো|লটারি)/i
    ]

    for (const pattern of spamPatterns) {
        if (pattern.test(cleanText)) {
            return {
                isBad: true,
                category: 'spam_promo',
                reason: 'Spam / Promo Link / Gambling',
                severity: 'medium'
            }
        }
    }

    return { isBad: false }
}
