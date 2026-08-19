<template>
  <section class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <!-- Header & Action Controls -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline/40">
      <div>
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <span class="material-symbols-outlined text-xl">inventory_2</span>
          </div>
          <h2 class="text-xl font-bold tracking-tight text-on-surface">Product Catalog &amp; Cloud Stock</h2>
        </div>
        <p class="text-xs text-on-surface-variant mt-1">
          Manage multi-image galleries, auto-link batch photos with Backblaze B2, and assign stock to AI agents.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <!-- Smart Batch Auto-Linker Button -->
        <label class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-secondary/10 hover:bg-secondary text-secondary hover:text-white border border-secondary/20 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer">
          <span class="material-symbols-outlined text-base">auto_fix_high</span>
          <span>🪄 Auto-Link Batch Images</span>
          <input type="file" multiple accept="image/*" class="hidden" @change="handleBatchUpload" />
        </label>

        <!-- Add Single Product Button -->
        <button 
          @click="openAddModal"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-accent shadow-xs transition-all cursor-pointer"
        >
          <span class="material-symbols-outlined text-base">add</span>
          <span>Add Product</span>
        </button>
      </div>
    </div>

    <!-- KPI Summary Pills -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="p-3.5 rounded-2xl bg-surface border border-outline flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <span class="material-symbols-outlined text-lg">check_circle</span>
        </div>
        <div>
          <span class="text-xs text-on-surface-variant block">Total Products</span>
          <span class="text-base font-bold text-on-surface">{{ products.length }}</span>
        </div>
      </div>

      <div class="p-3.5 rounded-2xl bg-surface border border-outline flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
          <span class="material-symbols-outlined text-lg">inventory</span>
        </div>
        <div>
          <span class="text-xs text-on-surface-variant block">In Stock</span>
          <span class="text-base font-bold text-emerald-600 dark:text-emerald-400">{{ inStockCount }}</span>
        </div>
      </div>

      <div class="p-3.5 rounded-2xl bg-surface border border-outline flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
          <span class="material-symbols-outlined text-lg">production_quantity_limits</span>
        </div>
        <div>
          <span class="text-xs text-on-surface-variant block">Low Stock (&le; 3)</span>
          <span class="text-base font-bold text-amber-600 dark:text-amber-400">{{ lowStockCount }}</span>
        </div>
      </div>

      <div class="p-3.5 rounded-2xl bg-surface border border-outline flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
          <span class="material-symbols-outlined text-lg">cloud_done</span>
        </div>
        <div>
          <span class="text-xs text-on-surface-variant block">Backblaze Gallery</span>
          <span class="text-base font-bold text-purple-600 dark:text-purple-400">{{ totalImagesCount }} Photos</span>
        </div>
      </div>
    </div>

    <!-- Search & Stock Filter Bar -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-3 border border-outline rounded-2xl">
      <div class="relative w-full sm:w-80">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-base">search</span>
        <input 
          v-model="searchQuery" 
          placeholder="Search by product title or SKU..." 
          class="w-full h-9 pl-9 pr-3 bg-surface-hover border border-outline rounded-xl text-xs text-on-surface outline-none focus:border-primary/50 transition-colors placeholder:text-on-surface-variant/50"
        />
      </div>

      <div class="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
        <button 
          v-for="filter in ['all', 'in-stock', 'low-stock', 'out-of-stock']" 
          :key="filter"
          @click="activeFilter = filter"
          :class="activeFilter === filter 
            ? 'bg-primary text-white font-semibold' 
            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-hover font-medium'"
          class="px-3 py-1.5 rounded-lg text-xs capitalize transition-colors whitespace-nowrap cursor-pointer"
        >
          {{ filter.replace('-', ' ') }}
        </button>
      </div>
    </div>

    <!-- Product Table Card -->
    <div class="bg-surface border border-outline rounded-2xl overflow-hidden shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse min-w-[960px]">
          <thead>
            <tr class="bg-surface-hover/50 border-b border-outline text-on-surface-variant font-semibold text-[11px] uppercase tracking-wider">
              <th class="py-3.5 px-4 whitespace-nowrap">Gallery</th>
              <th class="py-3.5 px-4 whitespace-nowrap">Product Name</th>
              <th class="py-3.5 px-4 whitespace-nowrap">SKU Code</th>
              <th class="py-3.5 px-4 whitespace-nowrap">Target Agent</th>
              <th class="py-3.5 px-4 text-right whitespace-nowrap">Price</th>
              <th class="py-3.5 px-4 text-center whitespace-nowrap">Stock Level</th>
              <th class="py-3.5 px-4 text-center whitespace-nowrap">Status</th>
              <th class="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline/40">
            <tr v-for="item in filteredProducts" :key="item.sku" class="hover:bg-surface-hover/40 transition-colors">
              <!-- Photo Gallery Thumbnail -->
              <td class="py-3 px-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <div class="w-12 h-12 rounded-xl bg-surface-hover border border-outline flex items-center justify-center text-on-surface-variant overflow-hidden shrink-0 shadow-2xs relative group/thumb">
                    <img v-if="getItemHeroImage(item)" :src="resolveImage(getItemHeroImage(item))" alt="Product" class="w-full h-full object-cover transition-transform group-hover/thumb:scale-105" />
                    <span v-else class="material-symbols-outlined text-base text-on-surface-variant/40">image</span>
                  </div>
                  <span v-if="(item.images || []).length > 1" class="text-[10px] px-2 py-0.5 rounded-md bg-surface-hover border border-outline font-bold text-on-surface-variant shadow-2xs">
                    +{{ item.images.length - 1 }}
                  </span>
                </div>
              </td>

              <!-- Name & Variant -->
              <td class="py-3.5 px-4 min-w-[220px]">
                <div class="space-y-1">
                  <span class="font-bold text-xs text-on-surface capitalize block leading-tight">{{ item.name }}</span>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-[11px] font-medium text-on-surface-variant">{{ item.size || 'Standard' }}</span>
                    <span v-if="getProductColorVariants(item).length > 0" class="text-on-surface-variant/30 text-[10px]">•</span>
                    <div v-if="getProductColorVariants(item).length > 0" class="flex items-center gap-1 flex-wrap">
                      <span 
                        v-for="(col, cIdx) in getProductColorVariants(item)" 
                        :key="cIdx"
                        class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-surface-hover border border-outline text-on-surface whitespace-nowrap shadow-2xs"
                      >
                        <span class="w-1.5 h-1.5 rounded-full shrink-0 shadow-2xs" :style="{ backgroundColor: getColorHex(col.name) }"></span>
                        <span class="capitalize font-semibold">{{ col.name }}</span>
                        <span v-if="col.quantity !== undefined" 
                          class="px-1.5 py-0.5 rounded text-[9px] font-bold"
                          :class="col.quantity > 3 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : (col.quantity > 0 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400')"
                        >
                          {{ col.quantity }} left{{ col.quantity <= 3 && col.quantity > 0 ? ' (Low)' : (col.quantity === 0 ? ' (Out)' : '') }}
                        </span>
                      </span>
                    </div>
                    <span v-else class="text-[11px] text-on-surface-variant">• {{ item.color || 'Standard' }}</span>
                  </div>
                </div>
              </td>

              <!-- SKU -->
              <td class="py-3.5 px-4 whitespace-nowrap">
                <span class="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-block shadow-2xs">
                  {{ item.sku }}
                </span>
              </td>

              <!-- Target Agent / Channel -->
              <td class="py-3.5 px-4 whitespace-nowrap">
                <span 
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border whitespace-nowrap shadow-2xs"
                  :class="getAgentBadgeClass(item.assigned_agent)"
                >
                  <span class="material-symbols-outlined text-sm shrink-0">{{ getAgentIcon(item.assigned_agent) }}</span>
                  <span class="truncate max-w-[130px]">{{ getAgentLabel(item.assigned_agent) }}</span>
                </span>
              </td>

              <!-- Price & Discount -->
              <td class="py-3.5 px-4 text-right whitespace-nowrap">
                <div class="flex flex-col items-end">
                  <span class="font-bold text-xs text-on-surface">৳{{ Number(item.price || 0).toLocaleString() }}</span>
                  <div v-if="item.regular_price && item.regular_price > item.price" class="flex items-center gap-1 mt-0.5">
                    <span class="text-[10px] text-on-surface-variant/60 line-through">৳{{ Number(item.regular_price).toLocaleString() }}</span>
                    <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                      {{ Math.round(((item.regular_price - item.price) / item.regular_price) * 100) }}% OFF
                    </span>
                  </div>
                </div>
              </td>

              <!-- Stock Quantity Controller -->
              <td class="py-3.5 px-4 text-center whitespace-nowrap">
                <div class="inline-flex items-center gap-1.5 bg-surface-hover px-2.5 py-1 rounded-xl border border-outline shadow-2xs">
                  <button 
                    @click="updateStock(item, -1)" 
                    class="w-5 h-5 rounded-lg flex items-center justify-center hover:bg-outline/50 text-on-surface font-bold transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span class="font-bold text-xs px-1 min-w-[20px]">{{ item.stock_quantity }}</span>
                  <button 
                    @click="updateStock(item, 1)" 
                    class="w-5 h-5 rounded-lg flex items-center justify-center hover:bg-outline/50 text-on-surface font-bold transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </td>

              <!-- Stock Status Pill -->
              <td class="py-3.5 px-4 text-center whitespace-nowrap">
                <span 
                  class="inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap shadow-2xs"
                  :class="item.stock_quantity > 3 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : item.stock_quantity > 0 
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-600 border-rose-500/20'"
                >
                  <span class="w-1.5 h-1.5 rounded-full mr-1.5 shrink-0" :class="item.stock_quantity > 3 ? 'bg-emerald-500' : item.stock_quantity > 0 ? 'bg-amber-500' : 'bg-rose-500'"></span>
                  {{ item.stock_quantity > 3 ? 'In Stock' : item.stock_quantity > 0 ? 'Low Stock' : 'Sold Out' }}
                </span>
              </td>

              <!-- Action Buttons -->
              <td class="py-3.5 px-4 text-right whitespace-nowrap">
                <div class="flex items-center justify-end gap-1.5">
                  <button 
                    @click="editProduct(item)" 
                    class="p-1.5 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all cursor-pointer shadow-2xs"
                    title="Edit Product & Gallery"
                  >
                    <span class="material-symbols-outlined text-base">edit</span>
                  </button>
                  <button 
                    @click="removeProduct(item.sku)" 
                    class="p-1.5 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer shadow-2xs"
                    title="Delete Product"
                  >
                    <span class="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredProducts.length === 0">
              <td colspan="8" class="py-12 text-center text-xs text-on-surface-variant space-y-1">
                <span class="material-symbols-outlined text-3xl text-on-surface-variant/30">inventory_2</span>
                <p>No products found matching your search.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal 1: Quick Add / Edit Product Modal with Multi-Image Gallery -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div class="bg-surface border border-outline rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div class="flex items-center justify-between border-b border-outline/40 pb-3">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-xl text-primary">add_shopping_cart</span>
                <h3 class="text-base font-bold text-on-surface">{{ isEditing ? 'Edit Product & Gallery' : 'Add New Product' }}</h3>
              </div>
              <button @click="showAddModal = false" class="p-1 rounded-lg text-on-surface-variant hover:bg-surface-hover transition-colors cursor-pointer">
                <span class="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div class="space-y-4 text-xs">
              <!-- Product Title & SKU Code Auto-Generator -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="font-medium text-on-surface-variant flex items-center gap-1">
                    <span>Product Title</span>
                    <span class="text-rose-500 font-bold">*</span>
                  </label>
                  <input 
                    v-model="productForm.name" 
                    @input="handleTitleInput"
                    placeholder="e.g. Classic Black Hoodie" 
                    class="w-full bg-surface-hover border border-outline rounded-xl px-3 py-2 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors" 
                    required 
                  />
                </div>

                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <label class="font-medium text-on-surface-variant flex items-center gap-1">
                      <span>SKU Code</span>
                      <span class="text-[10px] font-semibold" :class="isSkuCustomized ? 'text-purple-500' : 'text-emerald-500'">
                        ({{ isSkuCustomized ? 'Custom' : 'Auto' }})
                      </span>
                    </label>
                    <button 
                      type="button" 
                      @click="regenerateSku" 
                      class="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                      title="Regenerate SKU from title"
                    >
                      <span class="material-symbols-outlined text-xs">autorenew</span>
                      <span>Regenerate</span>
                    </button>
                  </div>
                  <input 
                    v-model="productForm.sku" 
                    @input="isSkuCustomized = true"
                    placeholder="e.g. classic-black-hoodie" 
                    class="w-full bg-surface-hover border border-outline rounded-xl px-3 py-2 text-xs font-mono font-medium text-on-surface outline-none focus:border-primary/50 transition-colors" 
                  />
                </div>
              </div>

              <!-- Regular & Sale / Offer Price -->
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="font-medium text-on-surface-variant">Regular Price (৳) <span class="text-on-surface-variant/50 text-[10px] font-normal">(Optional)</span></label>
                  <input v-model.number="productForm.regular_price" type="number" placeholder="e.g. 1500" class="w-full bg-surface-hover border border-outline rounded-xl px-3 py-2 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors" />
                </div>
                <div class="space-y-1">
                  <label class="font-medium text-on-surface-variant flex items-center justify-between">
                    <span class="flex items-center gap-1">
                      <span>Offer / Sale Price (৳)</span>
                      <span class="text-rose-500 font-bold">*</span>
                    </span>
                    <span v-if="productForm.regular_price && productForm.regular_price > productForm.price" class="text-[10px] text-rose-500 font-bold">
                      {{ Math.round(((productForm.regular_price - productForm.price) / productForm.regular_price) * 100) }}% OFF
                    </span>
                  </label>
                  <input v-model.number="productForm.price" type="number" placeholder="e.g. 1200" class="w-full bg-surface-hover border border-outline rounded-xl px-3 py-2 text-xs font-bold text-primary outline-none focus:border-primary/50 transition-colors" required />
                </div>
              </div>

              <!-- Target Agent / Channel -->
              <div class="space-y-1">
                <label class="font-medium text-on-surface-variant flex items-center gap-1">
                  <span>Connect To Agent / Channel</span>
                  <span class="text-rose-500 font-bold">*</span>
                </label>
                <select 
                  v-model="productForm.assigned_agent" 
                  class="w-full bg-surface-hover border border-outline rounded-xl px-3 py-2 text-xs font-medium text-on-surface outline-none focus:border-primary/50 transition-colors cursor-pointer"
                >
                  <option value="all">🌐 All Connected Agents (Global Store)</option>
                  <option 
                    v-for="ag in agents" 
                    :key="ag.id" 
                    :value="ag.id"
                  >
                    {{ ag.name || (formatPlatformName(ag.platform) + ' Agent') }} (ID: ...{{ ag.id.slice(-6) }})
                  </option>
                </select>
              </div>

              <!-- Size & Stock -->
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="font-medium text-on-surface-variant">Size / Variant <span class="text-on-surface-variant/50 text-[10px] font-normal">(Optional)</span></label>
                  <input v-model="productForm.size" placeholder="L / XL / 42" class="w-full bg-surface-hover border border-outline rounded-xl px-3 py-2 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors" />
                </div>
                <div class="space-y-1">
                  <label class="font-medium text-on-surface-variant flex items-center justify-between">
                    <span class="flex items-center gap-1">
                      <span>Stock Quantity</span>
                      <span class="text-rose-500 font-bold">*</span>
                    </span>
                    <span v-if="galleryTotalQuantity > 0" class="text-[10px] text-primary font-semibold">
                      (Total Gallery: {{ galleryTotalQuantity }})
                    </span>
                  </label>
                  <input v-model.number="productForm.stock_quantity" type="number" min="0" class="w-full bg-surface-hover border border-outline rounded-xl px-3 py-2 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors" required />
                </div>
              </div>

              <!-- Multi-Image Gallery Manager (Backblaze B2 & URL) -->
              <div class="space-y-2.5 pt-2 border-t border-outline/40">
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-xs text-on-surface flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm text-secondary">photo_library</span>
                    Product Photo Gallery ({{ (productForm.images || []).length }})
                  </span>
                  <div class="flex items-center gap-1.5">
                    <button 
                      type="button" 
                      @click="addImageUrlSlot" 
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-hover border border-outline text-[11px] font-semibold text-on-surface transition-colors cursor-pointer"
                    >
                      <span class="material-symbols-outlined text-xs text-primary">link</span>
                      <span>+ Paste URL</span>
                    </button>
                    <label class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 text-[11px] font-semibold transition-colors cursor-pointer">
                      <span class="material-symbols-outlined text-xs">add_photo_alternate</span>
                      <span>Upload Photo</span>
                      <input type="file" accept="image/*" class="hidden" @change="handleSingleGalleryUpload" />
                    </label>
                  </div>
                </div>

                <div class="space-y-2.5 max-h-60 overflow-y-auto pr-1 agent-scroll">
                  <div 
                    v-for="(img, idx) in productForm.images" 
                    :key="idx" 
                    class="p-3 rounded-2xl bg-surface-hover border border-outline/50 space-y-2.5"
                  >
                    <!-- Top Row: Thumbnail + Angle View + Color Variant + Delete -->
                    <div class="flex items-center gap-2">
                      <div class="w-10 h-10 rounded-xl bg-surface border border-outline flex items-center justify-center overflow-hidden shrink-0">
                        <img v-if="img.url" :src="resolveImage(img.url)" alt="Preview" class="w-full h-full object-cover" />
                        <span v-else class="material-symbols-outlined text-sm text-on-surface-variant/40">image</span>
                      </div>

                      <!-- Angle / View Selector -->
                      <div class="flex-1 min-w-0 space-y-0.5">
                        <label class="text-[10px] font-medium text-on-surface-variant block">Angle / View</label>
                        <select 
                          v-model="img.role" 
                          class="w-full bg-surface px-2 py-1 rounded-lg text-xs font-semibold text-primary outline-none border border-outline cursor-pointer"
                        >
                          <option value="hero">Front / Hero</option>
                          <option value="back">Back View</option>
                          <option value="detail">Fabric Detail</option>
                          <option value="chart">Size Chart</option>
                          <option value="model">Model Shot</option>
                        </select>
                      </div>

                      <!-- Custom Color Variant Dropdown -->
                      <div class="flex-1 min-w-0 space-y-0.5 relative">
                        <label class="text-[10px] font-medium text-on-surface-variant block">Color Variant</label>
                        
                        <div 
                          @click="activeColorDropdown = activeColorDropdown === idx ? null : idx"
                          class="w-full bg-surface px-2 py-1 rounded-lg text-xs font-semibold flex items-center justify-between border border-outline hover:border-primary/50 transition-colors cursor-pointer"
                        >
                          <div class="flex items-center gap-1.5 truncate">
                            <span 
                              class="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10 shadow-xs" 
                              :style="{ backgroundColor: getColorHex(img.color) }"
                            ></span>
                            <span :class="img.color ? 'text-on-surface font-semibold' : 'text-on-surface-variant/50 font-normal'">
                              {{ img.color || 'Select Color' }}
                            </span>
                          </div>
                          <span class="material-symbols-outlined text-xs text-on-surface-variant/70 shrink-0">arrow_drop_down</span>
                        </div>

                        <!-- Custom Popover Menu with sleek themed background -->
                        <div 
                          v-if="activeColorDropdown === idx" 
                          class="absolute left-0 w-48 top-full mt-1 z-50 bg-surface border border-outline rounded-2xl shadow-2xl p-2 space-y-2 animate-in zoom-in-95 duration-150 backdrop-blur-md"
                        >
                          <!-- Custom Color Input -->
                          <div class="relative">
                            <input 
                              v-model="img.color" 
                              placeholder="Type custom color..." 
                              class="w-full bg-surface-hover border border-outline rounded-xl pl-2.5 pr-6 py-1 text-xs text-on-surface outline-none focus:border-primary/50"
                              @click.stop
                            />
                            <button 
                              v-if="img.color" 
                              @click.stop="img.color = ''" 
                              class="absolute right-1.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-rose-500 text-[10px] cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>

                          <!-- Presets Palette -->
                          <div class="max-h-40 overflow-y-auto space-y-0.5 agent-scroll pr-0.5">
                            <div 
                              v-for="preset in COLOR_PRESETS" 
                              :key="preset.name"
                              @click="selectPresetColor(img, preset.name)"
                              class="flex items-center justify-between px-2 py-1 rounded-lg text-xs hover:bg-surface-hover transition-colors cursor-pointer"
                              :class="img.color?.toLowerCase() === preset.name.toLowerCase() ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface'"
                            >
                              <div class="flex items-center gap-2">
                                <span class="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10" :style="{ backgroundColor: preset.hex }"></span>
                                <span>{{ preset.name }}</span>
                              </div>
                              <span v-if="img.color?.toLowerCase() === preset.name.toLowerCase()" class="material-symbols-outlined text-xs text-primary">check</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Remove Button -->
                      <button 
                        type="button" 
                        @click="productForm.images.splice(idx, 1)"
                        class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer shrink-0 mt-3"
                        title="Remove"
                      >
                        <span class="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>

                    <!-- Middle Row: Size (Auto Capital) + Quantity (Required *, no icon) + Price (Optional) -->
                    <div class="grid grid-cols-3 gap-2">
                      <!-- Size Variant -->
                      <div class="space-y-0.5">
                        <label class="text-[10px] font-medium text-on-surface-variant flex items-center justify-between">
                          <span>Size</span>
                          <span class="text-on-surface-variant/50 text-[9px] font-normal">Optional</span>
                        </label>
                        <div class="flex items-center bg-surface px-2.5 py-1.5 rounded-xl border border-outline focus-within:border-primary/50">
                          <input 
                            v-model="img.size" 
                            @input="img.size = (img.size || '').toUpperCase()"
                            placeholder="M, L, XL" 
                            class="w-full bg-transparent text-xs text-on-surface outline-none uppercase font-semibold placeholder:normal-case placeholder:font-normal"
                          />
                        </div>
                      </div>

                      <!-- Quantity (No Icon) -->
                      <div class="space-y-0.5">
                        <div class="flex items-center justify-between">
                          <label class="text-[10px] font-medium text-on-surface-variant flex items-center gap-1">
                            <span>Quantity</span>
                            <span class="text-rose-500 font-bold">*</span>
                          </label>
                          <span v-if="img.quantity !== undefined" 
                            class="text-[9px] font-bold px-1.5 py-0.5 rounded-md border shadow-2xs"
                            :class="img.quantity > 3 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : (img.quantity > 0 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20')"
                          >
                            {{ img.quantity > 3 ? '🟢 In Stock' : (img.quantity > 0 ? '🟡 Low Stock' : '🔴 Out of Stock') }}
                          </span>
                        </div>
                        <div class="flex items-center bg-surface px-2.5 py-1.5 rounded-xl border border-outline focus-within:border-primary/50">
                          <input 
                            v-model.number="img.quantity" 
                            type="number" 
                            min="0"
                            placeholder="e.g. 5" 
                            class="w-full bg-transparent text-xs text-on-surface outline-none"
                            required
                          />
                        </div>
                      </div>

                      <!-- Price (Optional) -->
                      <div class="space-y-0.5">
                        <label class="text-[10px] font-medium text-on-surface-variant flex items-center justify-between">
                          <span>Price (৳)</span>
                          <span class="text-on-surface-variant/50 text-[9px] font-normal">Optional</span>
                        </label>
                        <div class="flex items-center gap-1 bg-surface px-2.5 py-1.5 rounded-xl border border-outline focus-within:border-primary/50">
                          <span class="text-xs font-bold text-on-surface-variant/60 shrink-0">৳</span>
                          <input 
                            v-model.number="img.price" 
                            type="number" 
                            min="0"
                            :placeholder="`e.g. ${productForm.price || 1000}`" 
                            class="w-full bg-transparent text-xs text-on-surface outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <!-- Bottom Row: Image URL Input -->
                    <div class="space-y-0.5">
                      <label class="text-[10px] font-medium text-on-surface-variant flex items-center gap-1">
                        <span>Image URL</span>
                        <span class="text-rose-500 font-bold">*</span>
                      </label>
                      <div class="flex items-center gap-1.5 bg-surface px-2.5 py-1.5 rounded-xl border border-outline focus-within:border-primary/50">
                        <span class="material-symbols-outlined text-xs text-on-surface-variant/50 shrink-0">link</span>
                        <input 
                          v-model="img.url" 
                          placeholder="Image URL (https://...)" 
                          class="w-full bg-transparent text-xs text-on-surface outline-none truncate"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Clean Empty State (No duplicate buttons) -->
                  <div v-if="(productForm.images || []).length === 0" class="py-6 text-center text-xs text-on-surface-variant/70 border border-dashed border-outline/60 rounded-2xl space-y-1">
                    <span class="material-symbols-outlined text-2xl text-on-surface-variant/40">add_photo_alternate</span>
                    <p>No photos added yet. Use <strong class="text-on-surface">"+ Paste URL"</strong> or <strong class="text-on-surface">"Upload Photo"</strong> above.</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 pt-3 border-t border-outline/40">
              <button 
                @click="showAddModal = false" 
                class="flex-1 py-2.5 rounded-xl border border-outline text-xs font-semibold hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                @click="saveProduct" 
                class="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-accent transition-colors shadow-xs cursor-pointer"
              >
                {{ isEditing ? 'Save Product' : 'Add to Catalog' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal 2: Visual Auto-Link Review & Confirmation Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAutoLinkModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div class="bg-surface border border-outline rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div class="flex items-center justify-between border-b border-outline/40 pb-3">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                  <span class="material-symbols-outlined text-xl">auto_fix_high</span>
                </div>
                <div>
                  <h3 class="text-base font-bold text-on-surface">Review Auto-Linked Images</h3>
                  <p class="text-xs text-on-surface-variant">Verify matched products before applying to your AI agents</p>
                </div>
              </div>
              <button @click="showAutoLinkModal = false" class="p-1 rounded-lg text-on-surface-variant hover:bg-surface-hover transition-colors cursor-pointer">
                <span class="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <!-- Uploading state -->
            <div v-if="batchUploading" class="py-12 text-center space-y-3">
              <div class="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p class="text-xs font-medium text-on-surface">Uploading {{ batchUploadQueue.length }} photos to Backblaze B2 &amp; auto-matching...</p>
            </div>

            <!-- Matched results grid -->
            <div v-else class="space-y-4">
              <div 
                v-for="group in autoMatchedGroups" 
                :key="group.productSku" 
                class="p-4 rounded-2xl bg-surface-hover/70 border border-outline space-y-3"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span class="font-bold text-xs text-on-surface">{{ group.productName }}</span>
                    <span class="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">({{ group.productSku }})</span>
                  </div>
                  <span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                    {{ group.confidence }}% Match
                  </span>
                </div>

                <!-- Matched images in this group -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div 
                    v-for="(photo, pIdx) in group.matchedImages" 
                    :key="pIdx"
                    class="p-2 rounded-xl bg-surface border border-outline/70 space-y-1.5 relative group/card"
                  >
                    <div class="h-20 rounded-lg bg-surface-hover overflow-hidden border border-outline">
                      <img :src="resolveImage(photo.url)" alt="Matched" class="w-full h-full object-cover" />
                    </div>
                    <div class="flex items-center justify-between text-[10px]">
                      <span class="font-bold uppercase text-primary">{{ photo.role }}</span>
                      <button 
                        @click="group.matchedImages.splice(pIdx, 1)" 
                        class="text-rose-500 hover:text-rose-700 cursor-pointer"
                        title="Unlink"
                      >
                        <span class="material-symbols-outlined text-xs">close</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Unmatched items if any -->
              <div v-if="unmatchedImages.length > 0" class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <div class="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <span class="material-symbols-outlined text-sm">warning</span>
                  <span>{{ unmatchedImages.length }} Unmatched Images (Manual Assignment)</span>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div v-for="(photo, uIdx) in unmatchedImages" :key="uIdx" class="p-2 rounded-xl bg-surface border border-outline text-xs space-y-1">
                    <div class="h-16 rounded-lg overflow-hidden border border-outline">
                      <img :src="resolveImage(photo.url)" alt="Unmatched" class="w-full h-full object-cover" />
                    </div>
                    <select 
                      @change="assignUnmatched(photo, uIdx, $event.target.value)"
                      class="w-full bg-surface-hover px-1.5 py-1 rounded text-[10px] text-on-surface outline-none border border-outline cursor-pointer"
                    >
                      <option value="">Assign To Product...</option>
                      <option v-for="p in products" :key="p.sku" :value="p.sku">{{ p.name }}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Action Controls -->
            <div class="flex items-center gap-2 pt-3 border-t border-outline/40">
              <button 
                @click="showAutoLinkModal = false" 
                class="flex-1 py-2.5 rounded-xl border border-outline text-xs font-semibold hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                @click="approveAutoLinkedGroups" 
                :disabled="batchUploading || autoMatchedGroups.length === 0"
                class="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-accent transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <span class="material-symbols-outlined text-base">check_circle</span>
                <span>🚀 Approve &amp; Sync All ({{ totalMatchedImagesCount }} Images)</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'

const props = defineProps({
  mockInventory: { type: Array, default: () => [] },
  agents: { type: Array, default: () => [] }
})

const emit = defineEmits(['save-inventory', 'add-product', 'remove-product'])

const products = ref(props.mockInventory && props.mockInventory.length > 0 ? JSON.parse(JSON.stringify(props.mockInventory)) : [])
const searchQuery = ref('')
const activeFilter = ref('all')
const showAddModal = ref(false)
const isEditing = ref(false)
const isSkuCustomized = ref(false)
const originalSku = ref('')
const showAutoLinkModal = ref(false)
const batchUploading = ref(false)
const batchUploadQueue = ref([])
const autoMatchedGroups = ref([])
const unmatchedImages = ref([])

const productForm = reactive({
  name: '',
  sku: '',
  size: '',
  color: '',
  regular_price: null,
  price: 1200,
  stock_quantity: 10,
  assigned_agent: 'all',
  images: []
})

const generateSkuFromName = (name) => {
  if (!name || !name.trim()) return ''
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const handleTitleInput = () => {
  if (!isSkuCustomized.value) {
    productForm.sku = generateSkuFromName(productForm.name)
  }
}

const regenerateSku = () => {
  isSkuCustomized.value = false
  const baseSku = generateSkuFromName(productForm.name) || 'item'
  let finalSku = baseSku
  let counter = 1
  while (products.value.some(p => p.sku === finalSku && (!isEditing.value || p.sku !== originalSku.value))) {
    finalSku = `${baseSku}-${counter}`
    counter++
  }
  productForm.sku = finalSku
}

const fetchInventory = async () => {
  try {
    const res = await $fetch('/api/admin/inventory')
    if (Array.isArray(res) && res.length > 0) {
      products.value = res
    }
  } catch (e) {
    console.error('Failed to load inventory from server:', e)
  }
}

watch(() => props.mockInventory, (newInv) => {
  if (Array.isArray(newInv) && newInv.length > 0 && !showAddModal.value) {
    products.value = JSON.parse(JSON.stringify(newInv))
  }
}, { deep: true, immediate: true })

const syncInventory = async () => {
  try {
    await $fetch('/api/admin/inventory', {
      method: 'POST',
      body: products.value
    })
    emit('save-inventory', products.value)
  } catch (e) {
    console.error('Failed to sync inventory to server:', e)
  }
}

onMounted(async () => {
  await fetchInventory()
})

const isProductLowStock = (p) => {
  if ((p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 3) return true
  if (Array.isArray(p.images)) {
    return p.images.some(img => typeof img.quantity === 'number' && img.quantity > 0 && img.quantity <= 3)
  }
  return false
}

const isProductOutOfStock = (p) => {
  if ((p.stock_quantity || 0) === 0) return true
  if (Array.isArray(p.images) && p.images.length > 0) {
    return p.images.every(img => typeof img.quantity === 'number' && img.quantity === 0)
  }
  return false
}

const isProductInStock = (p) => {
  return !isProductOutOfStock(p) && !isProductLowStock(p)
}

const inStockCount = computed(() => products.value.filter(p => isProductInStock(p)).length)
const lowStockCount = computed(() => products.value.filter(p => isProductLowStock(p)).length)
const outOfStockCount = computed(() => products.value.filter(p => isProductOutOfStock(p)).length)

const totalImagesCount = computed(() => {
  return products.value.reduce((total, p) => total + (p.images || []).filter(img => img.url && img.url.trim() !== '').length, 0)
})

const totalMatchedImagesCount = computed(() => {
  return autoMatchedGroups.value.reduce((tot, g) => tot + (g.matchedImages || []).length, 0)
})

const filteredProducts = computed(() => {
  return products.value.filter(p => {
    const name = (p.name || '').toLowerCase()
    const sku = (p.sku || '').toLowerCase()
    const term = (searchQuery.value || '').trim().toLowerCase()
    const matchesSearch = term ? name.includes(term) || sku.includes(term) : true
    
    if (!matchesSearch) return false

    if (activeFilter.value === 'in-stock') return isProductInStock(p)
    if (activeFilter.value === 'low-stock') return isProductLowStock(p)
    if (activeFilter.value === 'out-of-stock') return isProductOutOfStock(p)
    return true
  })
})

const getItemHeroImage = (item) => {
  if (!item.images || item.images.length === 0) return item.image || ''
  const hero = item.images.find(img => img.role === 'hero') || item.images[0]
  return hero?.url || item.image || ''
}

const getProductColors = (item) => {
  const colors = new Set()
  if (item.color && item.color.trim()) {
    colors.add(item.color.trim())
  }
  if (item.images && Array.isArray(item.images)) {
    item.images.forEach((img) => {
      if (img.color && img.color.trim()) {
        colors.add(img.color.trim())
      }
    })
  }
  return Array.from(colors)
}

const getProductColorVariants = (item) => {
  const map = new Map()
  if (item.images && Array.isArray(item.images)) {
    item.images.forEach((img) => {
      if (img.color && img.color.trim()) {
        const c = img.color.trim()
        const key = c.toLowerCase()
        if (!map.has(key)) {
          map.set(key, { name: c, quantity: typeof img.quantity === 'number' ? img.quantity : undefined, price: img.price })
        } else if (typeof img.quantity === 'number') {
          const prev = map.get(key)
          if (prev.quantity !== undefined) {
            prev.quantity += img.quantity
          } else {
            prev.quantity = img.quantity
          }
        }
      }
    })
  }
  if (map.size === 0 && item.color && item.color.trim()) {
    map.set(item.color.trim().toLowerCase(), { name: item.color.trim(), quantity: item.stock_quantity, price: item.price })
  }
  return Array.from(map.values())
}

const getColorHex = (name) => {
  const n = (name || '').toLowerCase()
  if (n.includes('white') || n.includes('shada')) return '#e2e8f0'
  if (n.includes('black') || n.includes('kalo')) return '#18181b'
  if (n.includes('maroon') || n.includes('burgundy')) return '#800020'
  if (n.includes('red') || n.includes('lal')) return '#ef4444'
  if (n.includes('navy') || n.includes('blue') || n.includes('nil')) return '#2563eb'
  if (n.includes('green') || n.includes('olive') || n.includes('shobuj')) return '#16a34a'
  if (n.includes('yellow') || n.includes('holud')) return '#eab308'
  if (n.includes('pink') || n.includes('golapi')) return '#ec4899'
  if (n.includes('grey') || n.includes('gray') || n.includes('ash')) return '#71717a'
  if (n.includes('beige') || n.includes('khaki')) return '#d4b996'
  return '#6366f1'
}

const activeColorDropdown = ref(null)

const COLOR_PRESETS = [
  { name: 'White', hex: '#ffffff' },
  { name: 'Black', hex: '#18181b' },
  { name: 'Maroon', hex: '#800020' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Navy Blue', hex: '#2563eb' },
  { name: 'Olive Green', hex: '#16a34a' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Grey / Ash', hex: '#71717a' },
  { name: 'Beige', hex: '#d4b996' },
  { name: 'Burgundy', hex: '#5b0e2d' },
]

const selectPresetColor = (img, colorName) => {
  img.color = colorName
  activeColorDropdown.value = null
}

const galleryTotalQuantity = computed(() => {
  return (productForm.images || []).reduce((sum, img) => sum + (Number(img.quantity) || 0), 0)
})

const updateStock = async (item, delta) => {
  const newQty = Math.max(0, item.stock_quantity + delta)
  item.stock_quantity = newQty
  await syncInventory()
}

const openAddModal = () => {
  isEditing.value = false
  isSkuCustomized.value = false
  originalSku.value = ''
  productForm.name = ''
  productForm.sku = ''
  productForm.size = ''
  productForm.color = ''
  productForm.regular_price = null
  productForm.price = 1200
  productForm.stock_quantity = 10
  productForm.assigned_agent = 'all'
  productForm.images = [{ role: 'hero', url: '', color: '', size: '', quantity: 10, price: null }]
  showAddModal.value = true
}

const editProduct = (item) => {
  isEditing.value = true
  isSkuCustomized.value = true
  originalSku.value = item.sku
  productForm.name = item.name
  productForm.sku = item.sku
  productForm.size = item.size
  productForm.color = item.color
  productForm.regular_price = item.regular_price || null
  productForm.price = item.price
  productForm.stock_quantity = item.stock_quantity
  productForm.assigned_agent = item.assigned_agent || 'all'
  productForm.images = Array.isArray(item.images) && item.images.length > 0 
    ? item.images.map(img => ({
        role: img.role || 'hero',
        url: img.url || '',
        color: img.color || '',
        size: (img.size || '').toUpperCase(),
        quantity: img.quantity !== undefined ? Number(img.quantity) : (Math.floor(item.stock_quantity / item.images.length) || 1),
        price: img.price !== undefined ? img.price : null
      })) 
    : (item.image ? [{ role: 'hero', url: item.image, color: item.color || '', size: (item.size || '').toUpperCase(), quantity: item.stock_quantity || 1, price: null }] : [])
  showAddModal.value = true
}

const resolveImage = (url) => {
  if (!url) return ''
  if (url.startsWith('/api/media')) return url
  if (url.includes('.backblazeb2.com/')) {
    const parts = url.split('.backblazeb2.com/')
    if (parts[1]) {
      return `/api/media/${parts[1]}`
    }
  }
  return url
}

const removeProduct = async (sku) => {
  products.value = products.value.filter(p => p.sku !== sku)
  await syncInventory()
}

const addImageUrlSlot = () => {
  if (!productForm.images) productForm.images = []
  productForm.images.push({
    role: productForm.images.length === 0 ? 'hero' : 'back',
    url: '',
    color: '',
    size: '',
    quantity: 1,
    price: null
  })
}

const handleSingleGalleryUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await $fetch('/api/upload', { method: 'POST', body: formData })
    if (res?.url) {
      productForm.images.push({
        role: productForm.images.length === 0 ? 'hero' : 'back',
        url: res.url,
        color: '',
        size: '',
        quantity: 1,
        price: null
      })
    }
  } catch (err) {
    alert('Upload failed: ' + err.message)
  }
}

// Smart Batch Auto-Linker
const handleBatchUpload = async (event) => {
  const files = Array.from(event.target.files || [])
  if (files.length === 0) return

  batchUploadQueue.value = files
  autoMatchedGroups.value = []
  unmatchedImages.value = []
  batchUploading.value = true
  showAutoLinkModal.value = true

  const uploadedFiles = []

  // 1. Upload all in parallel to Backblaze B2
  for (const file of files) {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await $fetch('/api/upload', { method: 'POST', body: formData })
      if (res?.url) {
        uploadedFiles.push({
          filename: file.name.toLowerCase(),
          url: res.url
        })
      }
    } catch (e) {
      console.error('Batch item upload error:', e)
    }
  }

  // 2. Pattern match uploaded files with existing Products
  const groupMap = {}

  uploadedFiles.forEach(item => {
    let matchedProduct = null
    let matchedRole = 'hero'

    // Detect Role from filename
    if (item.filename.includes('back') || item.filename.includes('rear')) matchedRole = 'back'
    else if (item.filename.includes('chart') || item.filename.includes('size')) matchedRole = 'chart'
    else if (item.filename.includes('detail') || item.filename.includes('fabric')) matchedRole = 'detail'
    else if (item.filename.includes('model') || item.filename.includes('wear')) matchedRole = 'model'

    // Match product by SKU or Title keyword
    for (const prod of products.value) {
      const skuClean = prod.sku.toLowerCase().replace(/[^a-z0-9]/g, '')
      const nameParts = prod.name.toLowerCase().split(' ').filter(w => w.length > 2)
      const fileClean = item.filename.replace(/[^a-z0-9]/g, '')

      const skuMatch = fileClean.includes(skuClean) || skuClean.includes(fileClean)
      const nameMatch = nameParts.some(part => item.filename.includes(part))

      if (skuMatch || nameMatch) {
        matchedProduct = prod
        break
      }
    }

    if (matchedProduct) {
      if (!groupMap[matchedProduct.sku]) {
        groupMap[matchedProduct.sku] = {
          productSku: matchedProduct.sku,
          productName: matchedProduct.name,
          confidence: 98,
          matchedImages: []
        }
      }
      groupMap[matchedProduct.sku].matchedImages.push({
        role: matchedRole,
        url: item.url
      })
    } else {
      unmatchedImages.value.push({
        url: item.url,
        filename: item.filename,
        role: matchedRole
      })
    }
  })

  autoMatchedGroups.value = Object.values(groupMap)
  batchUploading.value = false
}

const assignUnmatched = (photo, index, targetSku) => {
  if (!targetSku) return
  const prod = products.value.find(p => p.sku === targetSku)
  if (!prod) return

  let group = autoMatchedGroups.value.find(g => g.productSku === targetSku)
  if (!group) {
    group = {
      productSku: prod.sku,
      productName: prod.name,
      confidence: 100,
      matchedImages: []
    }
    autoMatchedGroups.value.push(group)
  }

  group.matchedImages.push({
    role: photo.role || 'hero',
    url: photo.url
  })

  unmatchedImages.value.splice(index, 1)
}

const approveAutoLinkedGroups = async () => {
  autoMatchedGroups.value.forEach(group => {
    const targetProduct = products.value.find(p => p.sku === group.productSku)
    if (targetProduct) {
      if (!targetProduct.images) targetProduct.images = []
      group.matchedImages.forEach(newImg => {
        targetProduct.images.push(newImg)
      })
    }
  })

  await syncInventory()
  showAutoLinkModal.value = false
  alert(`Successfully linked ${totalMatchedImagesCount.value} photos to your product catalog!`)
}

const saveProduct = async () => {
  if (!productForm.name || !productForm.name.trim()) {
    alert('Please enter a Product Title.')
    return
  }

  if (!productForm.sku || !productForm.sku.trim()) {
    productForm.sku = productForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ('item-' + Date.now())
  }

  if (!productForm.price || productForm.price <= 0) {
    alert('Please enter a valid Offer / Sale Price.')
    return
  }

  // Calculate total stock from gallery if variant quantities are defined
  const totalGalleryQty = (productForm.images || []).reduce((sum, img) => sum + (Number(img.quantity) || 0), 0)
  if (productForm.images && productForm.images.length > 0 && totalGalleryQty > 0) {
    productForm.stock_quantity = totalGalleryQty
  }

  if (isEditing.value) {
    const targetSku = originalSku.value || productForm.sku
    const existing = products.value.find(p => p.sku === targetSku)
    if (existing) {
      Object.assign(existing, { 
        ...productForm, 
        images: JSON.parse(JSON.stringify(productForm.images))
      })
    }
  } else {
    let finalSku = productForm.sku
    let counter = 1
    while (products.value.some(p => p.sku === finalSku)) {
      finalSku = `${productForm.sku}-${counter}`
      counter++
    }
    productForm.sku = finalSku

    products.value.unshift({
      id: 'item-' + Date.now(),
      ...productForm,
      images: JSON.parse(JSON.stringify(productForm.images))
    })
  }

  await syncInventory()
  showAddModal.value = false
  isEditing.value = false
  originalSku.value = ''
  isSkuCustomized.value = false
}

const formatPlatformName = (platform) => {
  if (platform === 'whatsapp') return 'WhatsApp'
  if (platform === 'telegram') return 'Telegram'
  if (platform === 'messenger') return 'Messenger'
  if (platform === 'fb_comment') return 'Facebook Comments'
  return platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'Direct'
}

const getAgentLabel = (assignedAgent) => {
  if (!assignedAgent || assignedAgent === 'all') return 'All Agents'
  const found = (props.agents || []).find(a => a.id === assignedAgent)
  if (found) return found.name || (formatPlatformName(found.platform) + ' Agent')
  return 'Specific Agent'
}

const getAgentIcon = (assignedAgent) => {
  if (!assignedAgent || assignedAgent === 'all') return 'hub'
  const found = (props.agents || []).find(a => a.id === assignedAgent)
  if (found?.platform === 'telegram') return 'send'
  if (found?.platform === 'whatsapp') return 'chat'
  if (found?.platform === 'messenger') return 'forum'
  return 'smart_toy'
}

const getAgentBadgeClass = (assignedAgent) => {
  if (!assignedAgent || assignedAgent === 'all') return 'bg-primary/10 text-primary border-primary/20'
  const found = (props.agents || []).find(a => a.id === assignedAgent)
  if (found?.platform === 'telegram') return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
  if (found?.platform === 'whatsapp') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  if (found?.platform === 'messenger') return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
  return 'bg-secondary/10 text-secondary border-secondary/20'
}
</script>
