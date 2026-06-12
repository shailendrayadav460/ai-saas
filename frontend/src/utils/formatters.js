export const formatDate = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(date));
};

export const formatTime = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
};

export const truncate = (str, len = 50) =>
  str?.length > len ? str.slice(0, len) + '...' : str;

export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
