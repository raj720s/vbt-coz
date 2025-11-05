// Simple utility to get username by ID from userInfo results
export const getUsernameById = (userId: number | null, userInfo: any, fallback: string = 'Unknown'): string => {
  if (!userId || !userInfo?.results) {
    return fallback;
  }
  
  return userInfo.results[userId] || fallback;
};
