const getBtoa = () => {
  if (typeof globalThis !== "undefined") {
    const candidate = (globalThis as typeof globalThis & { btoa?: (data: string) => string }).btoa;
    if (typeof candidate === "function") {
      return candidate;
    }
  }
  return null;
};

const getAtob = () => {
  if (typeof globalThis !== "undefined") {
    const candidate = (globalThis as typeof globalThis & { atob?: (data: string) => string }).atob;
    if (typeof candidate === "function") {
      return candidate;
    }
  }
  return null;
};

const encode = (value: string) => {
  const btoa = getBtoa();
  if (!btoa) {
    return value;
  }

  try {
    return btoa(encodeURIComponent(value));
  } catch (error) {
    console.warn("Falha ao codificar valor para URL mascarada:", error);
    return value;
  }
};

const decode = (value: string) => {
  const atob = getAtob();
  if (!atob) {
    return value;
  }

  try {
    return decodeURIComponent(atob(value));
  } catch (error) {
    console.warn("Falha ao decodificar valor mascarado:", error);
    return value;
  }
};

export const urlMask = {
  encode,
  decode,
};

export const maskIdentifier = (value: string | number) => encode(String(value));
export const revealIdentifier = (value: string | undefined | null) => {
  if (!value) return "";
  const decoded = decode(value);
  return decoded || value;
};
