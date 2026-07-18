import { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { env } from "../config/env";

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export class StorageValidationError extends Error {}

export interface ProofUploadInput {
  companyId: string;
  /** Raw base64 payload, WITHOUT the `data:<mime>;base64,` prefix. */
  base64Data: string;
  mimeType: string;
}

export interface ProofUploadResult {
  path: string;
  sizeBytes: number;
}

/**
 * Handles everything related to storing payment proof files in Supabase
 * Storage: validation, path layout, upload, deletion (for rollback), and
 * generating short-lived signed URLs for authorized viewers.
 *
 * The bucket ("payment-proofs") is PRIVATE. Nothing in this service ever
 * returns a public URL -- only signed URLs with a short TTL, minted on
 * demand for an already-authorized request. See
 * PaymentProofController.getSignedUrl for the authorization check.
 */
export class StorageService {
  constructor(
    private readonly client: SupabaseClient,
    private readonly bucket: string = env.paymentProofsBucket,
  ) {}

  validate(mimeType: string, sizeBytes: number): void {
    if (!env.allowedProofMimeTypes.includes(mimeType)) {
      throw new StorageValidationError(
        `Tipo de archivo no permitido (${mimeType}). Solo se aceptan: ${env.allowedProofMimeTypes.join(", ")}`,
      );
    }

    if (sizeBytes > env.maxProofFileSizeBytes) {
      const maxMb = (env.maxProofFileSizeBytes / (1024 * 1024)).toFixed(1);
      throw new StorageValidationError(`El archivo supera el límite de ${maxMb}MB permitido`);
    }

    if (sizeBytes === 0) {
      throw new StorageValidationError("El archivo está vacío");
    }
  }

  /** payment-proofs/{companyId}/{yyyy}/{mm}/{uuid}.{ext} */
  buildPath(companyId: string, mimeType: string): string {
    const ext = MIME_EXTENSIONS[mimeType] || "bin";
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${companyId}/${year}/${month}/${randomUUID()}.${ext}`;
  }

  async uploadProof(input: ProofUploadInput): Promise<ProofUploadResult> {
    let buffer: Buffer;
    try {
      buffer = Buffer.from(input.base64Data, "base64");
    } catch {
      throw new StorageValidationError("El archivo enviado no es un base64 válido");
    }

    this.validate(input.mimeType, buffer.length);
    const path = this.buildPath(input.companyId, input.mimeType);

    const { error } = await this.client.storage.from(this.bucket).upload(path, buffer, {
      contentType: input.mimeType,
      upsert: false,
    });

    if (error) throw new Error(`No se pudo subir el comprobante: ${error.message}`);

    return { path, sizeBytes: buffer.length };
  }

  /** Best-effort cleanup. Never throws -- called from rollback paths that must not mask the original error. */
  async remove(path: string): Promise<void> {
    try {
      const { error } = await this.client.storage.from(this.bucket).remove([path]);
      if (error) console.error("[StorageService] failed to remove orphaned file:", path, error.message);
    } catch (err) {
      console.error("[StorageService] failed to remove orphaned file:", path, (err as Error).message);
    }
  }

  async getSignedUrl(path: string, expiresInSeconds: number = env.proofSignedUrlTtlSeconds): Promise<string> {
    const { data, error } = await this.client.storage.from(this.bucket).createSignedUrl(path, expiresInSeconds);
    if (error || !data) throw new Error(`No se pudo generar el enlace del comprobante: ${error?.message}`);
    return data.signedUrl;
  }
}
