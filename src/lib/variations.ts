/**
 * Variation matching for variable products. Pure so it is unit-testable and
 * shared by the picker UI. WooCommerce still validates the chosen variation
 * server-side on add-to-cart — this only prevents offering invalid choices.
 */

export interface VariantLike {
  id: number;
  /** attribute name → term ("" means the variation accepts any term). */
  attributes: Record<string, string>;
  inStock: boolean;
  purchasable: boolean;
}

export type Selection = Record<string, string | undefined>;

const norm = (s: string) => s.trim().toLowerCase();

/** A variation term may be stored as the term name or its slug. */
function termMatches(variantValue: string, chosen: string, termAliases?: Map<string, string>): boolean {
  if (variantValue === "") return true;
  const v = norm(variantValue);
  const c = norm(chosen);
  return v === c || termAliases?.get(c) === v;
}

function matches(variant: VariantLike, selection: Selection, aliases?: Map<string, string>): boolean {
  return Object.entries(selection).every(
    ([name, value]) => value === undefined || termMatches(variant.attributes[name] ?? "", value, aliases),
  );
}

/** The variation matching a complete selection, or undefined. */
export function findVariant<V extends VariantLike>(
  variants: V[],
  selection: Selection,
  attributeNames: string[],
  aliases?: Map<string, string>,
): V | undefined {
  if (attributeNames.some((n) => !selection[n])) return undefined;
  return variants.find((v) => matches(v, selection, aliases));
}

/**
 * Whether choosing `value` for `attribute` (keeping the other current
 * choices) can still lead to a purchasable, in-stock variation.
 */
export function isOptionAvailable(
  variants: VariantLike[],
  selection: Selection,
  attribute: string,
  value: string,
  aliases?: Map<string, string>,
): boolean {
  const next = { ...selection, [attribute]: value };
  return variants.some((v) => v.inStock && v.purchasable && matches(v, next, aliases));
}

/** Whether a term exists on any variation at all (vs. merely out of stock). */
export function optionExists(
  variants: VariantLike[],
  attribute: string,
  value: string,
  aliases?: Map<string, string>,
): boolean {
  return variants.some((v) => termMatches(v.attributes[attribute] ?? "", value, aliases));
}
