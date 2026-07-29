/**
 * Format phone number to digits only (country code included, no + or spaces)
 */
export function cleanPhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}
