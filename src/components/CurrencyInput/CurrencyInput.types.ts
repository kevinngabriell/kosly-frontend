export interface CurrencyInputProps {
  /** Whole rupiah, or null while empty. */
  value: number | null;
  onChange: (value: number | null) => void;
  id?: string;
  invalid?: boolean;
  placeholder?: string;
  "aria-label"?: string;
  size?: "sm" | "md" | "lg";
}
