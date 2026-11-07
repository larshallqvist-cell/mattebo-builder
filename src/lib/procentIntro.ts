/** Instruktionen i Procent visas varje gång sidan öppnas tills eleven väljer bort den; då är den borta för gott (per elev och enhet). */
type KeyStore = Pick<Storage, "getItem" | "setItem">;

export const introKey = (userId: string | null | undefined) => `procent-intro-hidden-${userId ?? "anon"}`;

export const shouldShowIntro = (store: KeyStore, userId: string | null | undefined): boolean => {
  try { return store.getItem(introKey(userId)) !== "1"; } catch { return true; }
};

export const hideIntroForever = (store: KeyStore, userId: string | null | undefined): void => {
  try { store.setItem(introKey(userId), "1"); } catch { /* ignoreras */ }
};
