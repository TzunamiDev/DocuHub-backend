import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ProjectsService } from '../projects/projects.service';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class DocsAuthMiddleware implements NestMiddleware {
  // Simple in-memory cache to prevent DB lookup on every single asset request
  private cache = new Map<string, { isPrivate: boolean, timestamp: number }>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly projectsService: ProjectsService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const urlParts = req.url.split('/').filter(p => p.length > 0);
    // URL under /docs is typically /docs/shortLink/version/...
    // Since we are applying this to /docs, req.url might be /shortLink/version/...
    // Let's get the first part of the URL
    const shortLink = urlParts[0];

    if (!shortLink) {
      return next();
    }

    let isPrivate = false;
    const now = Date.now();
    const cached = this.cache.get(shortLink);

    // Cache valid for 30 seconds
    if (cached && (now - cached.timestamp < 30000)) {
      isPrivate = cached.isPrivate;
    } else {
      try {
        // Use findByShortLink, but we pass isAdmin=true to force it to return the project even if private
        // so we can check its isPrivate status
        const project = await this.projectsService.findByShortLink(shortLink, false, true);
        isPrivate = project.isPrivate;
        this.cache.set(shortLink, { isPrivate, timestamp: now });
      } catch (error) {
        // Project not found, let static server handle it (will be 404)
        return next();
      }
    }

    if (!isPrivate) {
      return next();
    }

    // Project is private, check for Admin JWT
    const token = req.cookies?.['jwt'];
    if (!token) {
      return res.status(403).send('Forbidden: Project is private and requires admin authentication.');
    }

    try {
      const decoded = this.jwtService.verify(token);
      if (decoded.role === UserRole.ADMIN) {
        return next();
      } else {
        return res.status(403).send('Forbidden: Project is private and requires admin authentication.');
      }
    } catch (e) {
      return res.status(403).send('Forbidden: Invalid or expired token.');
    }
  }
}
