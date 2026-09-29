export interface OtpInputProps {
  /** Digits typed so far ("" to "123456"). */
  value: string;
  onChange: (value: string) => void;
  /** Called once all digits are filled in. */
  onComplete?: (value: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  "aria-label": string;
}
