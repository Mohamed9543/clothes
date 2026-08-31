import { writeFile } from 'fs/promises';
import { LocalDiskProvider } from './local-disk.provider';

jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

describe('LocalDiskProvider', () => {
  it('writes the buffer to UPLOADS_DIR and returns the local URL shape unchanged', async () => {
    const provider = new LocalDiskProvider();
    const buffer = Buffer.from('fake-image-bytes');

    const result = await provider.save(buffer, 'abc-123.png', 'image/png');

    expect(writeFile).toHaveBeenCalledWith(expect.stringContaining('abc-123.png'), buffer);
    expect(result).toEqual({ url: '/uploads/abc-123.png' });
  });
});
