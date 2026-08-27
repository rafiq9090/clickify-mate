import crypto from 'crypto'
import { queryPg, withPgTransaction } from './db'
import { syncProductToKnowledgeStore } from './agent/rag/knowledge_indexer'

export interface CatalogProductInput {
  id?: string
  name: string
  sku: string
  size?: string
  color?: string
  price: number
  regular_price?: number
  stock_quantity: number
  image?: string
  images?: Array<Record<string, any>>
  assigned_agent?: string
}

function slugPart(value: unknown) {
  return String(value || 'standard').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'standard'
}

function productSlug(sku: string) {
  return `sku-${slugPart(sku)}-${crypto.createHash('sha1').update(sku.toLowerCase()).digest('hex').slice(0, 8)}`
}

async function shopIdForUser(userId: string) {
  const result = await queryPg('SELECT id FROM public.shops WHERE owner_user_id = $1 LIMIT 1', [userId])
  if (result.rows[0]?.id) {
    return String(result.rows[0].id)
  }

  const memberResult = await queryPg('SELECT shop_id FROM public.shop_members WHERE user_id = $1 LIMIT 1', [userId])
  if (memberResult.rows[0]?.shop_id) {
    return String(memberResult.rows[0].shop_id)
  }

  // Auto-provision default store profile if user was created directly
  const autoCreated = await queryPg(
    `INSERT INTO public.shops (owner_user_id, name, default_currency, default_country)
     VALUES ($1, 'Clickify Store', 'BDT', 'BD')
     RETURNING id`,
    [userId]
  )
  if (autoCreated.rows[0]?.id) {
    await queryPg(
      `INSERT INTO public.shop_members (shop_id, user_id, role, status)
       VALUES ($1, $2, 'owner', 'active')
       ON CONFLICT DO NOTHING`,
      [autoCreated.rows[0].id, userId]
    )
    return String(autoCreated.rows[0].id)
  }

  throw new Error('Shop profile could not be initialized for this account.')
}

export async function shopIdForAgent(agentId?: string) {
  if (!agentId) return null
  const result = await queryPg(
    `SELECT s.id
       FROM public.agent_configs ac
       JOIN public.shops s ON s.owner_user_id = ac.user_id
      WHERE ac.id = $1
      LIMIT 1`,
    [agentId]
  )
  return result.rows[0]?.id ? String(result.rows[0].id) : null
}

export async function listCatalogForShop(shopId: string): Promise<CatalogProductInput[]> {
  const result = await queryPg(
    `SELECT p.id, p.name, p.images, p.metadata, p.currency,
            pv.sku, pv.attributes, pv.price, pv.compare_at_price,
            pv.stock_quantity, pv.metadata AS variant_metadata
       FROM public.products p
       JOIN public.product_variants pv ON pv.product_id = p.id AND pv.is_active = true
      WHERE p.shop_id = $1 AND p.status = 'active'
      ORDER BY p.created_at ASC, pv.created_at ASC`,
    [shopId]
  )

  const grouped = new Map<string, any>()
  for (const row of result.rows) {
    let product = grouped.get(String(row.id))
    if (!product) {
      product = {
        id: row.metadata?.legacy_id || String(row.id),
        name: row.name,
        sku: row.variant_metadata?.base_sku || row.sku,
        size: '',
        color: '',
        price: Number(row.price),
        regular_price: row.compare_at_price == null ? undefined : Number(row.compare_at_price),
        stock_quantity: 0,
        image: Array.isArray(row.images) ? row.images.find((image: any) => image?.role === 'hero')?.url : undefined,
        images: Array.isArray(row.images) ? row.images.map((image: any) => ({ ...image })) : [],
        assigned_agent: row.metadata?.assigned_agent || 'all',
        _variants: []
      }
      grouped.set(String(row.id), product)
    }
    product.stock_quantity += Number(row.stock_quantity)
    product._variants.push({
      color: row.attributes?.color || '',
      size: row.attributes?.size || '',
      quantity: Number(row.stock_quantity),
      price: Number(row.price)
    })
  }

  return Array.from(grouped.values()).map(product => {
    if (Array.isArray(product.images)) {
      product.images = product.images.map((image: any) => {
        const variant = product._variants.find((item: any) =>
          (!image.color || slugPart(item.color) === slugPart(image.color)) &&
          (!image.size || slugPart(item.size) === slugPart(image.size))
        )
        return variant ? { ...image, quantity: variant.quantity, price: variant.price } : image
      })
    }
    delete product._variants
    return product
  })
}

export async function listCatalogForUser(userId: string) {
  return listCatalogForShop(await shopIdForUser(userId))
}

export async function listCatalogForAgent(agentId: string) {
  const shopId = await shopIdForAgent(agentId)
  if (!shopId) return []
  const catalog = await listCatalogForShop(shopId)
  return catalog.filter(product => !product.assigned_agent || product.assigned_agent === 'all' || product.assigned_agent === agentId)
}

function variantSpecs(product: CatalogProductInput) {
  const images = Array.isArray(product.images) ? product.images : []
  const detailed = images.filter(image => image && (image.color || image.size || typeof image.quantity === 'number'))
  const source = detailed.length ? detailed : [{ color: product.color, size: product.size, quantity: product.stock_quantity, price: product.price }]
  const unique = new Map<string, any>()
  for (const item of source) {
    const color = String(item.color || product.color || 'Standard')
    const size = String(item.size || product.size || 'Free Size')
    const key = `${slugPart(color)}|${slugPart(size)}`
    if (!unique.has(key)) {
      unique.set(key, {
        color,
        size,
        quantity: Math.max(0, Number(item.quantity ?? product.stock_quantity ?? 0)),
        price: Math.max(0, Number(item.price ?? product.price ?? 0))
      })
    }
  }
  return Array.from(unique.values())
}

export async function replaceCatalogForUser(userId: string, input: CatalogProductInput[]) {
  const shopId = await shopIdForUser(userId)
  await withPgTransaction(async client => {
    const incomingBaseSkus: string[] = []
    for (const product of input) {
      const baseSku = String(product.sku || '').trim()
      const name = String(product.name || '').trim()
      if (!baseSku || !name) throw new Error('Every product requires a name and SKU.')
      incomingBaseSkus.push(baseSku.toLowerCase())

      const productResult = await client.query(
        `INSERT INTO public.products (shop_id, name, slug, status, currency, images, metadata)
         VALUES ($1,$2,$3,'active','BDT',$4::jsonb,$5::jsonb)
         ON CONFLICT (shop_id, slug) DO UPDATE
           SET name = EXCLUDED.name, status = 'active', images = EXCLUDED.images,
               metadata = EXCLUDED.metadata, updated_at = now()
         RETURNING id`,
        [shopId, name, productSlug(baseSku), JSON.stringify(product.images || []), JSON.stringify({
          legacy_id: product.id || null,
          assigned_agent: product.assigned_agent || 'all'
        })]
      )
      const productId = productResult.rows[0].id
      const activeSkus: string[] = []
      const specs = variantSpecs(product)
      for (const spec of specs) {
        const derivedSku = specs.length === 1
          ? baseSku
          : `${baseSku}::${slugPart(spec.color)}::${slugPart(spec.size)}`.slice(0, 100)
        activeSkus.push(derivedSku)
        const previous = await client.query(
          'SELECT id, stock_quantity FROM public.product_variants WHERE shop_id = $1 AND sku = $2 FOR UPDATE',
          [shopId, derivedSku]
        )
        const before = Number(previous.rows[0]?.stock_quantity || 0)
        const variant = await client.query(
          `INSERT INTO public.product_variants (
             shop_id, product_id, sku, attributes, metadata, price, compare_at_price, stock_quantity, is_active
           ) VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8,true)
           ON CONFLICT (shop_id, sku) DO UPDATE
             SET product_id = EXCLUDED.product_id, attributes = EXCLUDED.attributes,
                 metadata = EXCLUDED.metadata, price = EXCLUDED.price,
                 compare_at_price = EXCLUDED.compare_at_price,
                 stock_quantity = EXCLUDED.stock_quantity, is_active = true,
                 version = public.product_variants.version + 1, updated_at = now()
           RETURNING id`,
          [
            shopId, productId, derivedSku,
            JSON.stringify({ color: spec.color, size: spec.size }),
            JSON.stringify({ base_sku: baseSku }),
            spec.price, product.regular_price ?? null, spec.quantity
          ]
        )
        const delta = spec.quantity - before
        if (delta !== 0) {
          await client.query(
            `INSERT INTO public.inventory_movements (
               shop_id, variant_id, quantity_delta, movement_type, reason, actor_user_id, stock_after
             ) VALUES ($1,$2,$3,'adjustment','Catalog synchronization',$4,$5)`,
            [shopId, variant.rows[0].id, delta, userId, spec.quantity]
          )
        }
      }
      await client.query(
        `UPDATE public.product_variants
            SET is_active = false, updated_at = now()
          WHERE shop_id = $1 AND product_id = $2 AND NOT (sku = ANY($3::text[]))`,
        [shopId, productId, activeSkus]
      )
    }

    await client.query(
      `UPDATE public.products p
          SET status = 'archived', updated_at = now()
        WHERE p.shop_id = $1
          AND NOT EXISTS (
            SELECT 1 FROM public.product_variants pv
            WHERE pv.product_id = p.id AND lower(pv.metadata->>'base_sku') = ANY($2::text[])
          )`,
      [shopId, incomingBaseSkus]
    )
  })

  // Synchronize active products to multi-tenant RAG knowledge store
  try {
    for (const product of input) {
      syncProductToKnowledgeStore(product, shopId).catch(err => {
        console.warn(`[KNOWLEDGE_SYNC_WARN]: Product ${product.sku} indexing deferred: ${err.message}`)
      })
    }
  } catch (err: any) {
    console.warn(`[KNOWLEDGE_SYNC_ERROR]: ${err.message}`)
  }

  return listCatalogForShop(shopId)
}

export async function findCatalogProduct(args: { agentId: string; sku?: string; color?: string; size?: string }) {
  const shopId = await shopIdForAgent(args.agentId)
  if (!shopId) return null
  const sku = String(args.sku || '').trim().toLowerCase()
  const color = slugPart(args.color || '')
  const size = slugPart(args.size || '')
  const result = await queryPg(
    `SELECT p.name, p.images, p.currency, pv.id AS variant_id, pv.sku, pv.price,
            pv.compare_at_price, pv.stock_quantity, pv.reserved_quantity, pv.attributes,
            pv.metadata->>'base_sku' AS base_sku
       FROM public.product_variants pv
       JOIN public.products p ON p.id = pv.product_id
      WHERE pv.shop_id = $1 AND pv.is_active = true AND p.status = 'active'
        AND (lower(pv.sku) = $2 OR lower(pv.metadata->>'base_sku') = $2 OR lower(p.name) LIKE $3)
      ORDER BY
        CASE WHEN $4 = '' OR lower(regexp_replace(COALESCE(pv.attributes->>'color',''), '[^a-z0-9]+', '-', 'g')) = $4 THEN 0 ELSE 1 END,
        CASE WHEN $5 = '' OR lower(regexp_replace(COALESCE(pv.attributes->>'size',''), '[^a-z0-9]+', '-', 'g')) = $5 THEN 0 ELSE 1 END
      LIMIT 1`,
    [shopId, sku, `%${sku}%`, args.color ? color : '', args.size ? size : '']
  )
  return result.rows[0] || null
}

export async function deductCatalogStock(args: {
  agentId?: string
  sku: string
  color?: string
  size?: string
  quantity: number
  referenceId?: string
}) {
  const shopId = await shopIdForAgent(args.agentId)
  if (!shopId) return { success: false, newStock: 0, message: 'Shop inventory is not configured.' }
  const quantity = Math.max(1, Number(args.quantity || 1))
  const sku = String(args.sku).trim().toLowerCase()

  return withPgTransaction(async client => {
    const result = await client.query(
      `SELECT pv.id, pv.stock_quantity, pv.reserved_quantity
         FROM public.product_variants pv
        WHERE pv.shop_id = $1 AND pv.is_active = true
          AND (lower(pv.sku) = $2 OR lower(pv.metadata->>'base_sku') = $2)
          AND ($3 = '' OR lower(pv.attributes->>'color') = lower($3))
          AND ($4 = '' OR lower(pv.attributes->>'size') = lower($4))
        ORDER BY pv.created_at ASC
        LIMIT 1
        FOR UPDATE`,
      [shopId, sku, String(args.color || ''), String(args.size || '')]
    )
    const variant = result.rows[0]
    if (!variant) return { success: false, newStock: 0, message: 'Product variant was not found.' }
    let ownReservation = 0
    if (args.referenceId) {
      const existingSale = await client.query(
        `SELECT 1 FROM public.inventory_movements
          WHERE reference_type = 'order' AND reference_id = $1 AND movement_type = 'sale'
          LIMIT 1`,
        [args.referenceId]
      )
      if (existingSale.rows[0]) {
        return { success: true, newStock: Number(variant.stock_quantity), message: 'Inventory was already fulfilled for this order.' }
      }
      const reservation = await client.query(
        `SELECT ABS(quantity_delta)::int AS quantity
           FROM public.inventory_movements
          WHERE variant_id = $1 AND reference_type = 'order' AND reference_id = $2
            AND movement_type = 'reserve'
            AND NOT EXISTS (
              SELECT 1 FROM public.inventory_movements released
               WHERE released.variant_id = public.inventory_movements.variant_id
                 AND released.reference_type = 'order'
                 AND released.reference_id = public.inventory_movements.reference_id
                 AND released.movement_type = 'release'
            )
          ORDER BY created_at DESC LIMIT 1`,
        [variant.id, args.referenceId]
      )
      ownReservation = Number(reservation.rows[0]?.quantity || 0)
    }
    const available = Number(variant.stock_quantity) - Number(variant.reserved_quantity) + ownReservation
    if (available < quantity) {
      return { success: false, newStock: available, message: `Only ${available} item(s) are available.` }
    }

    const stockAfter = Number(variant.stock_quantity) - quantity
    await client.query(
      `UPDATE public.product_variants
          SET stock_quantity = $2,
              reserved_quantity = GREATEST(0, reserved_quantity - $3),
              version = version + 1, updated_at = now()
        WHERE id = $1`,
      [variant.id, stockAfter, Math.min(quantity, ownReservation)]
    )
    await client.query(
      `INSERT INTO public.inventory_movements (
         shop_id, variant_id, quantity_delta, movement_type, reference_type, reference_id, reason, stock_after
       ) VALUES ($1,$2,$3,'sale','order',$4,'Order fulfillment',$5)`,
      [shopId, variant.id, -quantity, args.referenceId || null, stockAfter]
    )
    return { success: true, newStock: stockAfter, message: `Deducted ${quantity} item(s) from inventory.` }
  })
}

export async function reserveCatalogStock(args: {
  agentId: string
  sku: string
  color?: string
  size?: string
  quantity: number
  referenceId: string
}) {
  const shopId = await shopIdForAgent(args.agentId)
  if (!shopId) return { success: false, message: 'Shop inventory is not configured.' }
  const quantity = Math.max(1, Number(args.quantity || 1))
  return withPgTransaction(async client => {
    const alreadyReserved = await client.query(
      `SELECT 1 FROM public.inventory_movements
        WHERE reference_type = 'order' AND reference_id = $1 AND movement_type = 'reserve'
        LIMIT 1`,
      [args.referenceId]
    )
    if (alreadyReserved.rows[0]) return { success: true, message: 'Stock is already reserved for this order.' }

    const result = await client.query(
      `SELECT id, stock_quantity, reserved_quantity
         FROM public.product_variants
        WHERE shop_id = $1 AND is_active = true
          AND (lower(sku) = lower($2) OR lower(metadata->>'base_sku') = lower($2))
          AND ($3 = '' OR lower(attributes->>'color') = lower($3))
          AND ($4 = '' OR lower(attributes->>'size') = lower($4))
        ORDER BY created_at ASC LIMIT 1 FOR UPDATE`,
      [shopId, args.sku, String(args.color || ''), String(args.size || '')]
    )
    const variant = result.rows[0]
    if (!variant) return { success: false, message: 'Product variant was not found.' }
    const reservationAfterLock = await client.query(
      `SELECT 1 FROM public.inventory_movements
        WHERE reference_type = 'order' AND reference_id = $1 AND movement_type = 'reserve'
        LIMIT 1`,
      [args.referenceId]
    )
    if (reservationAfterLock.rows[0]) return { success: true, message: 'Stock is already reserved for this order.' }
    const available = Number(variant.stock_quantity) - Number(variant.reserved_quantity)
    if (available < quantity) return { success: false, message: `Only ${available} item(s) are available.` }

    await client.query(
      `UPDATE public.product_variants
          SET reserved_quantity = reserved_quantity + $2, version = version + 1, updated_at = now()
        WHERE id = $1`,
      [variant.id, quantity]
    )
    await client.query(
      `INSERT INTO public.inventory_movements
         (shop_id, variant_id, quantity_delta, movement_type, reference_type, reference_id, reason, stock_after)
       VALUES ($1,$2,$3,'reserve','order',$4,'Hosted payment reservation',$5)`,
      [shopId, variant.id, -quantity, args.referenceId, Number(variant.stock_quantity)]
    )
    return { success: true, message: `Reserved ${quantity} item(s).` }
  })
}

export async function releaseCatalogReservation(referenceId: string) {
  return withPgTransaction(async client => {
    const reservation = await client.query(
      `SELECT im.shop_id, im.variant_id, ABS(im.quantity_delta)::int AS quantity, pv.stock_quantity
         FROM public.inventory_movements im
         JOIN public.product_variants pv ON pv.id = im.variant_id
        WHERE im.reference_type = 'order' AND im.reference_id = $1 AND im.movement_type = 'reserve'
          AND NOT EXISTS (
            SELECT 1 FROM public.inventory_movements done
             WHERE done.reference_type = 'order' AND done.reference_id = im.reference_id
               AND done.movement_type IN ('release', 'sale')
          )
        ORDER BY im.created_at DESC LIMIT 1 FOR UPDATE OF pv`,
      [referenceId]
    )
    const row = reservation.rows[0]
    if (!row) return { success: true, released: false }
    await client.query(
      `UPDATE public.product_variants
          SET reserved_quantity = GREATEST(0, reserved_quantity - $2), version = version + 1, updated_at = now()
        WHERE id = $1`,
      [row.variant_id, row.quantity]
    )
    await client.query(
      `INSERT INTO public.inventory_movements
         (shop_id, variant_id, quantity_delta, movement_type, reference_type, reference_id, reason, stock_after)
       VALUES ($1,$2,$3,'release','order',$4,'Payment expired or cancelled',$5)`,
      [row.shop_id, row.variant_id, row.quantity, referenceId, row.stock_quantity]
    )
    return { success: true, released: true }
  })
}
