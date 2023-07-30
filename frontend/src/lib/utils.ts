import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ulid } from 'ulid'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// epoch now time
export function now() {
  return Math.floor(Date.now() / 1000);
}

export function dateToTimestamp(date: Date) {
  return Math.floor(date.getTime() / 1000);
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function timestampToDateString(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  let formattedDate = `${date.getFullYear()}-${twoDigitsTime(date.getMonth())}-${twoDigitsTime(date.getDate())}`;
  formattedDate += ` ${twoDigitsTime(date.getHours())}:${twoDigitsTime(date.getMinutes())}`;

  return formattedDate;
}


function twoDigitsTime(num: number): string {
  if (num < 10) return "0" + num;
  return `${num}`;
}

export function timer(timestamp: number) {
  if (timestamp < 0) return "00:00:00";

  const timeLeft = timestamp * 1000;
  const days = Math.floor(timeLeft / DAY);
  const hours = Math.floor((timeLeft % DAY) / HOUR);
  const minutes = Math.floor((timeLeft % HOUR) / MINUTE);
  const seconds = Math.floor((timeLeft % MINUTE) / SECOND);
  let formattedDate = '';
  if (days > 0) formattedDate += `${days}d `;
  formattedDate += `${twoDigitsTime(hours)}:${twoDigitsTime(minutes)}:${twoDigitsTime(seconds)}`;
  return formattedDate;
}

export function generateUUID() {
  let d = new Date().getTime();
  let d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0;
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    let r = Math.random() * 16;
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
  });
};

export function generateULID() {
  return ulid();
}