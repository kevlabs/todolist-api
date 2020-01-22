export function isDate(value: any): boolean {
  return !isNaN(Date.parse(value));
}