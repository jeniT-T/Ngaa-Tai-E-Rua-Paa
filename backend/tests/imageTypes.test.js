const { IMAGE_EXTENSIONS, detectImageExtension } = require('../utils/imageTypes');

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const GIF = Buffer.from('GIF89a000000', 'latin1');
const WEBP = Buffer.from('RIFF\x00\x00\x00\x00WEBP', 'latin1');

describe('IMAGE_EXTENSIONS (CR-11)', () => {
  test('maps each allowed MIME type to its own extension', () => {
    expect(IMAGE_EXTENSIONS).toEqual({
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    });
  });
});

describe('detectImageExtension (CR-11)', () => {
  test.each([
    ['PNG', PNG, '.png'],
    ['JPEG', JPEG, '.jpg'],
    ['GIF', GIF, '.gif'],
    ['WEBP', WEBP, '.webp'],
  ])('recognises a %s file from its first bytes', (name, bytes, expected) => {
    expect(detectImageExtension(bytes)).toBe(expected);
  });

  test('returns null for an HTML file', () => {
    expect(detectImageExtension(Buffer.from('<html><script>alert(1)</script>'))).toBeNull();
  });

  test('returns null for a RIFF file that is not WEBP (for example WAV audio)', () => {
    expect(detectImageExtension(Buffer.from('RIFF\x00\x00\x00\x00WAVE', 'latin1'))).toBeNull();
  });

  test('returns null for a file that is too short or empty', () => {
    expect(detectImageExtension(Buffer.from([0x89, 0x50]))).toBeNull();
    expect(detectImageExtension(Buffer.alloc(0))).toBeNull();
  });

  test('returns null when it is not given a Buffer', () => {
    expect(detectImageExtension(undefined)).toBeNull();
    expect(detectImageExtension('GIF89a')).toBeNull();
  });
});
