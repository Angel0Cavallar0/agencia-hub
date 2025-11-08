const encodeWithFallback = (value: string) => {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    return window.btoa(value);
  }

  if (typeof globalThis !== "undefined") {
    const bufferCtor = (globalThis as Record<string, any>).Buffer;
    if (bufferCtor) {
      return bufferCtor.from(value, "utf-8").toString("base64");
    }
  }

  return value;
};

const decodeWithFallback = (value: string) => {
  if (typeof window !== "undefined" && typeof window.atob === "function") {
    return window.atob(value);
  }

  if (typeof globalThis !== "undefined") {
    const bufferCtor = (globalThis as Record<string, any>).Buffer;
    if (bufferCtor) {
      return bufferCtor.from(value, "base64").toString("utf-8");
    }
  }

  return value;
};

const toBase64Url = (value: string) =>
  encodeWithFallback(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromBase64Url = (value: string) => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const normalized = padded + "=".repeat(padLength);
  return decodeWithFallback(normalized);
};

export const maskIdentifier = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  try {
    return toBase64Url(value);
  } catch (error) {
    console.error("Erro ao mascarar identificador:", error);
    return value;
  }
};

export const unmaskIdentifier = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  try {
    return fromBase64Url(value);
  } catch (error) {
    console.error("Erro ao desmascarar identificador:", error);
    return value;
  }
};
