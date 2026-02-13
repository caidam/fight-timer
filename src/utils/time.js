export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatTimeShort = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return `${mins}m`;
  if (mins === 0) return `${secs}s`;
  return `${mins}m${secs}s`;
};

export const parseTimeInput = (value) => {
  if (!value) return 0;
  const str = value.toString().trim().toLowerCase();

  if (str.includes('s') && !str.includes(':')) {
    const num = parseInt(str.replace(/[^\d]/g, ''));
    return isNaN(num) ? 0 : num;
  }

  if (str.includes(':')) {
    const parts = str.split(':');
    const mins = parseInt(parts[0]) || 0;
    const secs = parseInt(parts[1]) || 0;
    return mins * 60 + secs;
  }

  const num = parseFloat(str);
  if (isNaN(num)) return 0;

  if (str.includes('.')) {
    return Math.round(num * 60);
  }

  return Math.round(num * 60);
};

export const parseSecondsInput = (value) => {
  if (!value) return 0;
  const str = value.toString().trim().toLowerCase();
  const num = parseInt(str.replace(/[^\d]/g, ''));
  return isNaN(num) ? 0 : num;
};

export const getRandomInRange = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
