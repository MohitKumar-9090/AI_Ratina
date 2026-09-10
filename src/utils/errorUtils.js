function asText(value) {
  if (typeof value === 'string' && value.trim()) return value;
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join('; ');
  if (value && typeof value === 'object') return asText(value.message) || asText(value.detail) || asText(value.error);
  return '';
}

export function getErrorMessage(error) {
  const message = asText(error?.payload) || asText(error?.response?.data) || asText(error?.detail) || asText(error?.message) || asText(error);
  return message || 'Unable to complete the request. Please try again.';
}
