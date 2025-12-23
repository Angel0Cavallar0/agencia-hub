// Formata número de telefone para exibição: +55 (XX) XXXXX-XXXX
export const formatPhoneDisplay = (phone: string | null | undefined): string => {
  if (!phone) return "";
  
  // Remove tudo que não é número
  const numbers = phone.replace(/\D/g, "");
  
  // Se não começar com 55, retorna como está
  if (!numbers.startsWith("55")) return phone;
  
  // Remove o 55 do início
  const withoutCountry = numbers.slice(2);
  
  if (withoutCountry.length === 11) {
    // Formato: +55 (XX) XXXXX-XXXX
    const ddd = withoutCountry.slice(0, 2);
    const firstPart = withoutCountry.slice(2, 7);
    const secondPart = withoutCountry.slice(7);
    return `+55 (${ddd}) ${firstPart}-${secondPart}`;
  } else if (withoutCountry.length === 10) {
    // Formato: +55 (XX) XXXX-XXXX
    const ddd = withoutCountry.slice(0, 2);
    const firstPart = withoutCountry.slice(2, 6);
    const secondPart = withoutCountry.slice(6);
    return `+55 (${ddd}) ${firstPart}-${secondPart}`;
  }
  
  return phone;
};

// Converte número formatado para formato de banco: 55XXXXXXXXXXX
export const formatPhoneStorage = (phone: string): string => {
  if (!phone) return "";
  
  // Remove tudo que não é número
  const numbers = phone.replace(/\D/g, "");
  
  // Se já tem 55 no início, retorna como está
  if (numbers.startsWith("55")) return numbers;
  
  // Adiciona 55 no início se for um número brasileiro válido
  if (numbers.length === 10 || numbers.length === 11) {
    return `55${numbers}`;
  }
  
  return numbers;
};

// Valida se o telefone está no formato correto
export const isValidBrazilianPhone = (phone: string): boolean => {
  const numbers = phone.replace(/\D/g, "");
  
  // Deve ter 13 dígitos (55 + DDD + número)
  if (numbers.length !== 13) return false;
  
  // Deve começar com 55
  if (!numbers.startsWith("55")) return false;
  
  return true;
};
