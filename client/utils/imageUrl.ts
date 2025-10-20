export const CONFIG = {
  BASE_URL: "http://192.168.100.191:5000",
  DEFAULT_AVATAR: "https://img.icons8.com/ios-filled/100/user-male-circle.png",
  DEFAULT_BOT_AVATAR: "https://img.icons8.com/color/96/bot.png"
} as const;

export const getImageUrl = (path?: string | null, type: 'user' | 'bot' = 'user'): string => {
  if (!path) {
    return type === 'bot' ? CONFIG.DEFAULT_BOT_AVATAR : CONFIG.DEFAULT_AVATAR;
  }

  if (path.startsWith('http')) {
    return path;
  }

  // Remove any leading slashes and join with BASE_URL
  const cleanPath = path.replace(/^\/+/, '');
  return `${CONFIG.BASE_URL}/${cleanPath}`;
};