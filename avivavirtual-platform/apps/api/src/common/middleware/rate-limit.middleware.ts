import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;
const bucket = new Map<string, { count: number; expiresAt: number }>();

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const current = bucket.get(key);

    if (!current || current.expiresAt < now) {
      bucket.set(key, { count: 1, expiresAt: now + WINDOW_MS });
      return next();
    }

    if (current.count >= MAX_REQUESTS) {
      return res.status(429).json({ message: 'Too many requests. Try again later.' });
    }

    current.count += 1;
    next();
  }
}
