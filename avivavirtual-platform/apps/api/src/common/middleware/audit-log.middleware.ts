import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

type AuditRequest = Request & {
  auditContext?: {
    method: string;
    path: string;
    at: string;
  };
};

@Injectable()
export class AuditLogMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
      (req as AuditRequest).auditContext = {
        method: req.method,
        path: req.originalUrl,
        at: new Date().toISOString()
      };
    }
    next();
  }
}
