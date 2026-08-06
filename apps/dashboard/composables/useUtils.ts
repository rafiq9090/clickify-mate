export const useUtils = () => {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Provide user feedback here (e.g., toast)
      console.log('Copied to clipboard:', text)
      return true
    } catch (err) {
      console.error('Failed to copy text:', err)
      return false
    }
  }

  const truncateString = (str: string, length: number) => {
    return str.length > length ? str.substring(0, length) + '...' : str
  }

  return {
    copyToClipboard,
    truncateString
  }
}
