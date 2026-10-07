import { pool } from '../config/database.js';

export interface AuditLogEntry {
  adminId: string;
  adminUsername?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  ipAddress?: string;
  userAgent?: string;
}

export const auditLogService = {
  /**
   * Write immutable audit log record to PostgreSQL
   * Enforced with WORM tamper-prevention trigger at database level
   */
  async record(entry: AuditLogEntry): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO admin_audit_logs (
           admin_id, admin_username, action, entity_type, entity_id, 
           old_value, new_value, ip_address, user_agent, timestamp
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          entry.adminId,
          entry.adminUsername || 'SYSTEM_OPERATOR',
          entry.action,
          entry.entityType,
          entry.entityId || null,
          entry.oldValue ? JSON.stringify(entry.oldValue) : null,
          entry.newValue ? JSON.stringify(entry.newValue) : null,
          entry.ipAddress || '127.0.0.1',
          entry.userAgent || 'GoPlay-Admin-Client',
        ]
      );
    } catch (err: any) {
      console.error('[AUDIT LOGGING FAILURE] Critical error recording immutable audit trail:', {
        action: entry.action,
        entityType: entry.entityType,
        error: err?.message,
      });
      // Do not silently swallow in production if compliance demands persistence
      throw err;
    }
  },

  /**
   * Fetch paginated audit trail for compliance review
   */
  async listLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.action && params.action !== 'ALL') {
      conditions.push(`aal.action = $${idx++}`);
      values.push(params.action);
    }
    if (params.entityType && params.entityType !== 'ALL') {
      conditions.push(`aal.entity_type = $${idx++}`);
      values.push(params.entityType);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*) as total FROM admin_audit_logs aal ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    values.push(limit, offset);
    const logsRes = await pool.query(
      `SELECT aal.id, aal.admin_id, aal.admin_username, aal.action, aal.entity_type, aal.entity_id, 
              aal.old_value, aal.new_value, aal.ip_address, aal.user_agent, aal.timestamp,
              COALESCE(au.role, 'OPERATOR') as admin_role
         FROM admin_audit_logs aal
         LEFT JOIN admin_users au ON aal.admin_id = au.id::text
        ${whereClause}
        ORDER BY aal.timestamp DESC
        LIMIT $${idx++} OFFSET $${idx++}`,
      values
    );

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      logs: logsRes.rows,
    };
  },
};
