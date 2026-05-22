import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class AuditLogMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
      req['auditContext'] = {
        method: req.method,
        path: req.originalUrl,
        at: new Date().toISOString()
      };
    }
    next();
  }
}
