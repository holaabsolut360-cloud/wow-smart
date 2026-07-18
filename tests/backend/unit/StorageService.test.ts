import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageService, StorageValidationError } from '../../../server/services/StorageService';

function createStorageClient() {
  const upload = vi.fn();
  const remove = vi.fn();
  const createSignedUrl = vi.fn();

  const client = {
    storage: {
      from: vi.fn(() => ({
        upload,
        remove,
        createSignedUrl,
      })),
    },
  } as any;

  return { client, upload, remove, createSignedUrl };
}

describe('StorageService', () => {
  let svc: StorageService;
  let upload: ReturnType<typeof vi.fn>;
  let remove: ReturnType<typeof vi.fn>;
  let createSignedUrl: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const deps = createStorageClient();
    upload = deps.upload;
    remove = deps.remove;
    createSignedUrl = deps.createSignedUrl;
    svc = new StorageService(deps.client, 'payment-proofs');
  });

  it('acepta JPG, PNG, WEBP y PDF', () => {
    expect(() => svc.validate('image/jpeg', 1024)).not.toThrow();
    expect(() => svc.validate('image/png', 1024)).not.toThrow();
    expect(() => svc.validate('image/webp', 1024)).not.toThrow();
    expect(() => svc.validate('application/pdf', 1024)).not.toThrow();
  });

  it('rechaza EXE y ZIP', () => {
    expect(() => svc.validate('application/x-msdownload', 1024)).toThrow(StorageValidationError);
    expect(() => svc.validate('application/zip', 1024)).toThrow(StorageValidationError);
  });

  it('rechaza archivo vacio/corrupto', async () => {
    await expect(svc.uploadProof({
      companyId: 'c1',
      base64Data: '',
      mimeType: 'image/jpeg',
    })).rejects.toThrow('vacío');
  });

  it('rechaza archivo demasiado grande', () => {
    expect(() => svc.validate('image/jpeg', 10 * 1024 * 1024)).toThrow(StorageValidationError);
  });

  it('falla cuando el bucket no existe o storage devuelve error', async () => {
    upload.mockResolvedValue({ error: { message: 'Bucket not found' } });

    await expect(svc.uploadProof({
      companyId: 'c1',
      base64Data: Buffer.from('hello').toString('base64'),
      mimeType: 'image/jpeg',
    })).rejects.toThrow('Bucket not found');
  });

  it('sube archivo valido y retorna path', async () => {
    upload.mockResolvedValue({ error: null });

    const result = await svc.uploadProof({
      companyId: 'c1',
      base64Data: Buffer.from('hello').toString('base64'),
      mimeType: 'image/png',
    });

    expect(result.path.startsWith('c1/')).toBe(true);
    expect(result.sizeBytes).toBeGreaterThan(0);
  });

  it('maneja limpieza de huerfanos sin romper', async () => {
    remove.mockRejectedValue(new Error('storage timeout'));
    await expect(svc.remove('any/path')).resolves.toBeUndefined();
  });

  it('genera URL firmada o lanza error si esta vencida/invalida', async () => {
    createSignedUrl.mockResolvedValueOnce({ data: { signedUrl: 'https://signed/url' }, error: null });
    await expect(svc.getSignedUrl('proof/path')).resolves.toBe('https://signed/url');

    createSignedUrl.mockResolvedValueOnce({ data: null, error: { message: 'expired token' } });
    await expect(svc.getSignedUrl('proof/path')).rejects.toThrow('expired token');
  });
});
