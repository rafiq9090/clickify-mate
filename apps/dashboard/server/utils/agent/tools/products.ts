import { listCatalogForAgent } from '../../catalog-store'

export async function searchProducts(args: {
    query?: string
    agentId?: string
}): Promise<any[]> {
    const catalog = args.agentId ? await listCatalogForAgent(args.agentId) : []
    const q = (args.query || '').toLowerCase().trim()

    let items = catalog
    if (args.agentId) {
        items = items.filter((p: any) => !p.assigned_agent || p.assigned_agent === 'all' || p.assigned_agent === args.agentId)
    }

    if (!q) return items

    return items.filter((p: any) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.color && p.color.toLowerCase().includes(q))
    )
}

export async function getProductVariants(sku: string, agentId?: string): Promise<any[]> {
    const catalog = agentId ? await listCatalogForAgent(agentId) : []
    const product = catalog.find((p: any) => p.sku?.toLowerCase() === sku.toLowerCase() || p.name?.toLowerCase().includes(sku.toLowerCase()))
    if (!product || !Array.isArray(product.images)) return []

    return product.images.map((img: any) => ({
        color: img.color || 'Standard',
        size: img.size || 'Free Size',
        stock: img.quantity !== undefined ? img.quantity : (product.stock_quantity || 0),
        imageUrl: img.url
    }))
}

export async function resolveProductImagesTool(args: {
    agentId?: string
    query?: string
    sku?: string
    color?: string
}): Promise<{ images: string[]; productMatched?: string; message?: string }> {
    const catalog = args.agentId ? await listCatalogForAgent(args.agentId) : []
    const query = (args.query || '').toLowerCase()
    const sku = (args.sku || '').toLowerCase()
    const color = (args.color || '').toLowerCase()

    // 1. Find matched product in catalog
    const product = catalog.find((p: any) => {
        if (sku && (p.sku?.toLowerCase() === sku || p.sku?.toLowerCase().includes(sku))) return true
        if (query && (p.name?.toLowerCase().includes(query) || p.sku?.toLowerCase().includes(query))) return true
        if (query.includes('hoodie') && (p.name?.toLowerCase().includes('hoodie') || p.sku?.toLowerCase().includes('hoodie'))) return true
        if ((query.includes('t-shirt') || query.includes('tshirt')) && (p.name?.toLowerCase().includes('t-shirt') || p.sku?.toLowerCase().includes('t-shirt'))) return true
        return false
    }) || catalog[0]

    if (!product) {
        return { images: [], message: 'Product not found in merchant catalog.' }
    }

    const resolvedUrls: string[] = []

    // 2. If specific color requested, extract images matching that color
    if (color && Array.isArray(product.images)) {
        const colorImages = product.images.filter((img: any) => (img.color || '').toLowerCase().includes(color) || color.includes((img.color || '').toLowerCase()))
        for (const img of colorImages) {
            if (img.url && !resolvedUrls.includes(img.url)) resolvedUrls.push(img.url)
        }
    }

    // 3. If no color-specific match or general query, collect product gallery images (up to 3)
    if (resolvedUrls.length === 0 && Array.isArray(product.images)) {
        for (const img of product.images) {
            if (img.url && !resolvedUrls.includes(img.url)) {
                resolvedUrls.push(img.url)
                if (resolvedUrls.length >= 3) break
            }
        }
    }

    // 4. Fallback to hero image if present
    if (resolvedUrls.length === 0 && product.image) {
        resolvedUrls.push(product.image)
    }

    return {
        images: resolvedUrls,
        productMatched: product.name,
        message: resolvedUrls.length > 0
            ? `Found ${resolvedUrls.length} merchant photo(s) for ${product.name}.`
            : `No exact photos attached in catalog for this variant.`
    }
}
