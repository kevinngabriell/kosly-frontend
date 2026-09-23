import { Box } from "@chakra-ui/react";
import type { BlobProps } from "./Blob.types";

const BLOB_PATH =
  "M45.3,-58.5C58.5,-49.6,68.8,-34.6,72.6,-17.9C76.4,-1.2,73.7,17.1,64.9,31.6C56.1,46.1,41.2,56.8,24.5,63.2C7.8,69.6,-10.7,71.7,-27.4,66.7C-44.1,61.7,-59,49.6,-67.1,34.1C-75.2,18.6,-76.5,-0.3,-71.1,-16.6C-65.7,-32.9,-53.6,-46.6,-39.2,-55.4C-24.8,-64.2,-8.1,-68.1,7.3,-77.1C22.7,-86.1,45.3,-58.5,45.3,-58.5Z";

/** Soft organic decoration used behind hero/section content — never carries meaning, purely texture. */
export function Blob({ color = "primary.100", size = "240px", top, left, right, bottom, opacity = 1, rotate }: BlobProps) {
  return (
    <Box
      position="absolute"
      top={top}
      left={left}
      right={right}
      bottom={bottom}
      w={size}
      h={size}
      color={color}
      opacity={opacity}
      transform={rotate ? `rotate(${rotate}deg)` : undefined}
      pointerEvents="none"
      aria-hidden="true"
      zIndex={0}
    >
      <svg viewBox="0 0 200 200" width="100%" height="100%">
        <path fill="currentColor" d={BLOB_PATH} transform="translate(100 100)" />
      </svg>
    </Box>
  );
}
