import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Product } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getItemUnitPrice(product: Product, selectedVars?: Record<string, string>): number {
  let price = product.price;
  if (product.variations && selectedVars) {
    product.variations.forEach(v => {
      const selectedVal = selectedVars[v.name];
      if (selectedVal && v.valuePrices && typeof v.valuePrices[selectedVal] === 'number') {
        price += v.valuePrices[selectedVal];
      }
    });
  }
  return price;
}
