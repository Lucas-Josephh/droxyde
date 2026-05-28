function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  apiUrl: required('NEXT_PUBLIC_API_URL', process.env.NEXT_PUBLIC_API_URL),
  // Server-side fallback if the API is reachable through a different URL on the server
  apiInternalUrl: process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || '',
};
