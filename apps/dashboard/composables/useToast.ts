import { ref } from 'vue'

export const useToast = () => {
    const toast = ref({ show: false, message: '', type: 'success' })

    const showToast = (message: string, type: string = 'success') => {
        toast.value = { show: true, message, type }
        setTimeout(() => (toast.value.show = false), 3000)
    }

    const confirmModal = ref<{ show: boolean; title: string; message: string; onConfirm: (() => void) | null }>({
        show: false,
        title: '',
        message: '',
        onConfirm: null
    })

    const askConfirm = (title: string, message: string, callback: () => void) => {
        confirmModal.value = { show: true, title, message, onConfirm: callback }
    }

    return { toast, showToast, confirmModal, askConfirm }
}
