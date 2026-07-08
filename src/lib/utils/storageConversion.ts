/**
 * Storage Unit Conversion Utility
 * Handles conversion between different storage units (Bytes, KB, MB, GB, TB)
 */

export type StorageUnit = 'bytes' | 'kb' | 'mb' | 'gb' | 'tb';

export interface StorageUnitOption {
  value: StorageUnit;
  label: string;
  abbreviation: string;
}

// Storage unit options for dropdowns
export const STORAGE_UNIT_OPTIONS: StorageUnitOption[] = [
  { value: 'bytes', label: 'Bytes', abbreviation: 'B' },
  { value: 'kb', label: 'Kilobytes', abbreviation: 'KB' },
  { value: 'mb', label: 'Megabytes', abbreviation: 'MB' },
  { value: 'gb', label: 'Gigabytes', abbreviation: 'GB' },
  { value: 'tb', label: 'Terabytes', abbreviation: 'TB' },
];

// Conversion factors to bytes (base unit) - using binary (1024)
export const STORAGE_CONVERSIONS: Record<StorageUnit, number> = {
  bytes: 1,
  kb: 1024,
  mb: 1024 ** 2,      // 1,048,576
  gb: 1024 ** 3,      // 1,073,741,824
  tb: 1024 ** 4,      // 1,099,511,627,776
};

/**
 * Convert from one storage unit to another
 * @example convertStorageUnit(1, 'gb', 'mb') => 1024
 */
export function convertStorageUnit(
  quantity: number,
  fromUnit: StorageUnit,
  toUnit: StorageUnit
): number {
  if (quantity === 0) return 0;
  const bytes = quantity * STORAGE_CONVERSIONS[fromUnit];
  return bytes / STORAGE_CONVERSIONS[toUnit];
}

/**
 * Convert any unit to base unit (Bytes)
 */
export function toBaseUnit(quantity: number, unit: StorageUnit): number {
  return quantity * STORAGE_CONVERSIONS[unit];
}

/**
 * Convert from base unit (Bytes) to target unit
 */
export function fromBaseUnit(bytes: number, unit: StorageUnit): number {
  if (bytes === 0) return 0;
  return bytes / STORAGE_CONVERSIONS[unit];
}

/**
 * Calculate total price based on per-unit pricing with unit conversion
 * @param quantity - Quantity in the user's chosen unit
 * @param displayUnit - The unit the user entered quantity in (e.g., 'gb')
 * @param pricePerUnit - Price per unit in pricing unit
 * @param pricingUnit - The unit used for pricing (e.g., 'mb')
 * @returns Total price
 *
 * @example
 * // User enters 1 GB, price is $0.01 per MB
 * calculateStoragePrice(1, 'gb', 0.01, 'mb')
 * // => 1 GB = 1024 MB, so 1024 * 0.01 = $10.24
 */
export function calculateStoragePrice(
  quantity: number,
  displayUnit: StorageUnit,
  pricePerUnit: number,
  pricingUnit: StorageUnit
): number {
  if (quantity === 0 || pricePerUnit === 0) return 0;

  // Convert user quantity to pricing unit
  const quantityInPricingUnit = convertStorageUnit(quantity, displayUnit, pricingUnit);
  return quantityInPricingUnit * pricePerUnit;
}

/**
 * Format storage amount for display with auto unit selection
 * @example formatStorage(1073741824) => "1.00 GB"
 */
export function formatStorageAuto(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units: StorageUnit[] = ['tb', 'gb', 'mb', 'kb', 'bytes'];

  for (const unit of units) {
    const value = bytes / STORAGE_CONVERSIONS[unit];
    if (value >= 1) {
      return `${value.toFixed(2)} ${getUnitAbbreviation(unit)}`;
    }
  }

  return `${bytes} B`;
}

/**
 * Format storage in a specific unit
 * @example formatStorageInUnit(1073741824, 'gb') => "1.00 GB"
 */
export function formatStorageInUnit(bytes: number, unit: StorageUnit): string {
  const value = fromBaseUnit(bytes, unit);
  return `${value.toFixed(2)} ${getUnitAbbreviation(unit)}`;
}

/**
 * Get unit abbreviation
 */
export function getUnitAbbreviation(unit: StorageUnit): string {
  const option = STORAGE_UNIT_OPTIONS.find(opt => opt.value === unit);
  return option?.abbreviation || unit.toUpperCase();
}

/**
 * Get unit label
 */
export function getUnitLabel(unit: StorageUnit): string {
  const option = STORAGE_UNIT_OPTIONS.find(opt => opt.value === unit);
  return option?.label || unit;
}

/**
 * Parse storage input string
 * @example parseStorage("1.5 GB") => { quantity: 1.5, unit: 'gb' }
 */
export function parseStorage(input: string): { quantity: number; unit: StorageUnit } | null {
  const match = input.trim().match(/^([\d.]+)\s*(B|KB|MB|GB|TB|bytes|kb|mb|gb|tb)?$/i);
  if (!match) return null;

  const quantity = parseFloat(match[1]);
  if (isNaN(quantity)) return null;

  const unitStr = (match[2] || 'bytes').toLowerCase();
  const unitMap: Record<string, StorageUnit> = {
    'b': 'bytes',
    'bytes': 'bytes',
    'kb': 'kb',
    'kilobytes': 'kb',
    'mb': 'mb',
    'megabytes': 'mb',
    'gb': 'gb',
    'gigabytes': 'gb',
    'tb': 'tb',
    'terabytes': 'tb',
  };

  const unit = unitMap[unitStr] || 'bytes';

  return { quantity, unit };
}

/**
 * Check if a component type is a storage type
 */
export function isStorageComponentType(componentType: string): boolean {
  if (!componentType) return false;
  const storageTypes = ['storage_gb', 'storage_mb', 'storage_kb', 'storage_tb', 'storage'];
  return storageTypes.includes(componentType.toLowerCase());
}

/**
 * Get the default storage unit for a component type
 */
export function getDefaultStorageUnit(componentType: string): StorageUnit {
  if (!componentType) return 'gb';

  const typeToUnit: Record<string, StorageUnit> = {
    'storage_gb': 'gb',
    'storage_mb': 'mb',
    'storage_kb': 'kb',
    'storage_tb': 'tb',
    'storage': 'gb',
  };

  return typeToUnit[componentType.toLowerCase()] || 'gb';
}

/**
 * Calculate conversion preview text
 * @example getConversionPreview(1, 'gb', 'mb') => "1 GB = 1,024 MB"
 */
export function getConversionPreview(
  quantity: number,
  fromUnit: StorageUnit,
  toUnit: StorageUnit
): string {
  if (quantity === 0 || fromUnit === toUnit) return '';

  const converted = convertStorageUnit(quantity, fromUnit, toUnit);
  const fromAbbr = getUnitAbbreviation(fromUnit);
  const toAbbr = getUnitAbbreviation(toUnit);

  return `${quantity} ${fromAbbr} = ${converted.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${toAbbr}`;
}
