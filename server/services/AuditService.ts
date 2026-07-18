import { AuditRepository } from "../repositories/AuditRepository";

export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  async log(params: {
    companyId: string | null;
    userId: string | null;
    userName: string;
    action: string;
    resource: string;
    details: string;
  }): Promise<void> {
    await this.auditRepository.record({
      company_id: params.companyId,
      user_id: params.userId,
      user_name: params.userName,
      action: params.action,
      resource: params.resource,
      details: params.details,
    });
  }
}
