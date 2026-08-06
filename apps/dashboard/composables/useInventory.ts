import { ref, reactive } from 'vue'

export const useInventory = (showToast: Function, askConfirm: Function) => {
    const mockInventory = ref<any[]>([])
    const loadingInventory = ref(false)
    const savingInventory = ref(false)
    const showInventory = ref(true)

    const newProduct = reactive({
        name: '', sku: '', size: '', color: '', price: 1000, stock_quantity: 10
    })

    const fetchInventory = async () => {
        loadingInventory.value = true
        try {
            const data: any = await $fetch('/api/admin/inventory')
            mockInventory.value = data || []
        } catch (e: any) {
            showToast('Failed to load mock inventory: ' + e.message, 'error')
        } finally {
            loadingInventory.value = false
        }
    }

    const saveInventory = async () => {
        savingInventory.value = true
        try {
            await $fetch('/api/admin/inventory', { method: 'POST', body: mockInventory.value })
            showToast('Mock inventory saved successfully!', 'success')
        } catch (e: any) {
            showToast('Failed to save mock inventory: ' + e.message, 'error')
        } finally {
            savingInventory.value = false
        }
    }

    const addProduct = () => {
        if (!newProduct.name || !newProduct.sku) {
            showToast('Product Name and SKU are required', 'warning')
            return
        }
        const exists = mockInventory.value.some(item => item.sku.toLowerCase() === newProduct.sku.toLowerCase())
        if (exists) {
            showToast(`Product with SKU "${newProduct.sku}" already exists!`, 'warning')
            return
        }
        mockInventory.value.push({
            id: `item-${Date.now()}`,
            name: newProduct.name,
            sku: newProduct.sku.toUpperCase(),
            size: newProduct.size || 'N/A',
            color: newProduct.color || 'N/A',
            price: Number(newProduct.price) || 0,
            stock_quantity: Number(newProduct.stock_quantity) || 0
        })
        newProduct.name = ''; newProduct.sku = ''; newProduct.size = ''
        newProduct.color = ''; newProduct.price = 1000; newProduct.stock_quantity = 10
        showToast('Product added. Click "Save Changes" to write to disk.', 'success')
    }

    const removeProduct = (sku: string) => {
        mockInventory.value = mockInventory.value.filter(item => item.sku !== sku)
        showToast('Product removed. Click "Save Changes" to write to disk.', 'info')
    }

    const resetToDefaultInventory = () => {
        askConfirm('Reset Mock Inventory?', 'This will reset your mock inventory to the default four demo products.', async () => {
            const defaults = [
                { id: 'item-001', name: 'Blue T-Shirt', sku: 'BLUE-SHIRT-M', size: 'M', color: 'Blue', price: 1200, stock_quantity: 5 },
                { id: 'item-002', name: 'Blue T-Shirt', sku: 'BLUE-SHIRT-L', size: 'L', color: 'Blue', price: 1200, stock_quantity: 0 },
                { id: 'item-003', name: 'Black Hoodie', sku: 'BLACK-HOODIE-L', size: 'L', color: 'Black', price: 1800, stock_quantity: 3 },
                { id: 'item-004', name: 'White Sneakers', sku: 'WHITE-SNEAKERS-42', size: '42', color: 'White', price: 2500, stock_quantity: 10 }
            ]
            mockInventory.value = defaults
            try {
                await $fetch('/api/admin/inventory', { method: 'POST', body: defaults })
                showToast('Mock inventory reset to default demo data', 'success')
            } catch (e: any) {
                showToast('Failed to reset: ' + e.message, 'error')
            }
        })
    }

    return {
        mockInventory, loadingInventory, savingInventory, showInventory, newProduct,
        fetchInventory, saveInventory, addProduct, removeProduct, resetToDefaultInventory
    }
}
