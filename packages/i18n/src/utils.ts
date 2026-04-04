/**
 * Replace `{key}` placeholders in a template string with values.
 *
 * @example
 * interpolate("{count} items in catalog", { count: 42 })
 * // → "42 items in catalog"
 *
 * interpolate('"{name}" will be removed', { name: "Pocari Sweat" })
 * // → '"Pocari Sweat" will be removed'
 */
export function interpolate(
  template: string,
  params: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`
  );
}
