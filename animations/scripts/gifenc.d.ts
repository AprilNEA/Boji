// Types for gifenc 1.0.3, which ships none. The package is CommonJS without named exports for Node, so
// scripts import its default export. Only the members that scripts/readme.ts uses are declared.
declare module 'gifenc' {
  type Format = 'rgb565' | 'rgb444' | 'rgba4444';
  /** Colors as [r, g, b] bytes, or [r, g, b, a] for the rgba4444 format. */
  type Palette = number[][];
  interface FrameOptions {
    /** Required for the first frame, which writes it as the global color table. */
    palette?: Palette;
    /** Milliseconds. */
    delay?: number;
    /** 0 repeats forever. */
    repeat?: number;
    transparent?: boolean;
    transparentIndex?: number;
    /** GIF disposal method. -1 keeps the encoder default. */
    dispose?: number;
  }
  interface Encoder {
    writeFrame(index: Uint8Array, width: number, height: number, options?: FrameOptions): void;
    finish(): void;
    bytes(): Uint8Array;
  }
  const gifenc: {
    GIFEncoder(options?: { auto?: boolean; initialCapacity?: number }): Encoder;
    quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number, options?: { format?: Format }): Palette;
    applyPalette(rgba: Uint8Array | Uint8ClampedArray, palette: Palette, format?: Format): Uint8Array;
  };
  export default gifenc;
}
