export function formatHashtag(value?: string | null) {
  const text = value?.trim();

  if (!text) {
    return "";
  }

  return text.startsWith("#") ? text : `#${text}`;
}
