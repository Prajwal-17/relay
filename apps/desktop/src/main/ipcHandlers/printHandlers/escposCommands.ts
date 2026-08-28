const ESC = 0x1b;
const GS = 0x1d;

function bytes(...values: number[]): Buffer {
  return Buffer.from(values);
}

export const escPosCommands = {
  // reset the printer
  reset: bytes(ESC, 0x40),

  // align text to the left
  alignLeft: bytes(ESC, 0x61, 0x00),

  // align text to the center
  alignCenter: bytes(ESC, 0x61, 0x01),

  // turn bold text off
  boldOff: bytes(ESC, 0x45, 0x00),

  // turn bold text on
  boldOn: bytes(ESC, 0x45, 0x01),

  // use normal text size
  normalText: bytes(GS, 0x21, 0x00),

  // make text twice as tall
  doubleHeightText: bytes(GS, 0x21, 0x01),

  // make text twice as wide and twice as tall
  doubleSizeText: bytes(GS, 0x21, 0x11),

  // print a new line
  lineFeed: bytes(0x0a),

  // use qr model 2
  qrModel2: bytes(GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00),

  // use qr dot size 6
  qrDotSize6: bytes(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x06),

  // use medium qr error correction
  qrErrorCorrectionMedium: bytes(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31),

  // store qr content in printer memory
  storeQrData(dataLength: number): Buffer {
    const commandLength = dataLength + 3;
    return bytes(
      GS,
      0x28,
      0x6b,
      commandLength & 0xff,
      (commandLength >> 8) & 0xff,
      0x31,
      0x50,
      0x30
    );
  },

  // print the stored qr code
  printQr: bytes(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30),

  // print a one bit raster image
  gsV0RasterHeader(widthBytes: number, height: number): Buffer {
    if (
      !Number.isInteger(widthBytes) ||
      widthBytes < 1 ||
      widthBytes > 0xffff ||
      !Number.isInteger(height) ||
      height < 1 ||
      height > 0xffff
    ) {
      throw new Error("Raster command dimensions are invalid.");
    }
    return bytes(
      GS,
      0x76,
      0x30,
      0x00,
      widthBytes & 0xff,
      (widthBytes >> 8) & 0xff,
      height & 0xff,
      (height >> 8) & 0xff
    );
  },

  // feed blank lines
  feedLines(lineCount: number): Buffer {
    return bytes(ESC, 0x64, lineCount);
  },

  // cut the paper but leave a small part attached
  partialCut: bytes(GS, 0x56, 0x01),

  // cut the paper completely
  fullCut: bytes(GS, 0x56, 0x00)
};
