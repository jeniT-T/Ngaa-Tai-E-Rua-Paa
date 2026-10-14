// backend/utils/imageTypes.js
// Which image types the upload route accepts (code review CR-11).
//
// The browser sets the MIME type and the file name, so neither can be trusted.
// The stored file name gets its extension from the MIME type, and the first
// bytes of the saved file must match that type.
const fs = require('fs');

const IMAGE_EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

// Works out the extension from the first bytes of a file. Returns null when the
// bytes are not a JPEG, PNG, GIF or WEBP image.
function detectImageExtension(head) {
  if (!Buffer.isBuffer(head)) return null;

  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return '.jpg';
  }
  if (
    head.length >= 8 &&
    head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return '.png';
  }
  if (head.length >= 6) {
    const signature = head.subarray(0, 6).toString('latin1');
    if (signature === 'GIF87a' || signature === 'GIF89a') return '.gif';
  }
  if (
    head.length >= 12 &&
    head.subarray(0, 4).toString('latin1') === 'RIFF' &&
    head.subarray(8, 12).toString('latin1') === 'WEBP'
  ) {
    return '.webp';
  }
  return null;
}

// Reads the first 12 bytes of a file on disk.
function readHead(filePath) {
  const head = Buffer.alloc(12);
  const fd = fs.openSync(filePath, 'r');
  try {
    const bytesRead = fs.readSync(fd, head, 0, 12, 0);
    return head.subarray(0, bytesRead);
  } finally {
    fs.closeSync(fd);
  }
}

module.exports = { IMAGE_EXTENSIONS, detectImageExtension, readHead };
