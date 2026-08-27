// plugins/00.hookable-polyfill.ts
import { Hookable, HookableCore } from 'hookable'

const patchClass = (cls: any) => {
  if (cls && cls.prototype && !cls.prototype.hookOnce) {
    cls.prototype.hookOnce = function (name: string, fn: Function) {
      const unregister = this.hook(name, (...args: any[]) => {
        if (typeof unregister === 'function') {
          unregister()
        }
        return fn(...args)
      })
      return unregister
    }
  }
}

patchClass(Hookable)
patchClass(HookableCore)

export default defineNuxtPlugin((nuxtApp) => {
  if (nuxtApp.hooks && !(nuxtApp.hooks as any).hookOnce) {
    ;(nuxtApp.hooks as any).hookOnce = function (name: string, fn: Function) {
      const unregister = (this.hook || nuxtApp.hook).call(this, name, (...args: any[]) => {
        if (typeof unregister === 'function') {
          unregister()
        }
        return fn(...args)
      })
      return unregister
    }
  }
})
