// IDs apenas para registros fictícios; funciona também em previews HTTP na rede local.
export function createDemoId() {
  return globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
