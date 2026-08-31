import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { S3Provider } from './s3.provider';

jest.mock('@aws-sdk/client-s3', () => {
  const send = jest.fn().mockResolvedValue({});
  return {
    S3Client: jest.fn().mockImplementation(() => ({ send })),
    PutObjectCommand: jest.fn().mockImplementation((input: unknown) => ({ input })),
  };
});

describe('S3Provider', () => {
  const config: Record<string, string> = {
    S3_BUCKET: 'libas-uploads',
    S3_PUBLIC_URL_BASE: 'https://cdn.example.com/',
    S3_REGION: 'auto',
    S3_ENDPOINT: 'https://s3.example.com',
    S3_ACCESS_KEY: 'access',
    S3_SECRET_KEY: 'secret',
  };
  const configService = { get: (key: string) => config[key] } as never;

  it('puts the object in the configured bucket and returns a URL built from S3_PUBLIC_URL_BASE', async () => {
    const provider = new S3Provider(configService);
    const buffer = Buffer.from('fake-model-bytes');

    const result = await provider.save(buffer, 'model-1.glb', 'model/gltf-binary');

    expect(PutObjectCommand).toHaveBeenCalledWith({
      Bucket: 'libas-uploads',
      Key: 'model-1.glb',
      Body: buffer,
      ContentType: 'model/gltf-binary',
    });
    const clientInstance = (S3Client as unknown as jest.Mock).mock.results[0].value;
    expect(clientInstance.send).toHaveBeenCalled();
    expect(result).toEqual({ url: 'https://cdn.example.com/model-1.glb' });
  });
});
