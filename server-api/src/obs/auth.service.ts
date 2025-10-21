import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a secure random API token
   */
  generateToken(): string {
    // Generate a 32-byte random token and encode as base64url
    const buffer = crypto.randomBytes(32);
    return buffer.toString('base64url');
  }

  /**
   * Create or regenerate API token for an OBS instance
   */
  async generateTokenForInstance(clientId: string): Promise<string> {
    const token = this.generateToken();

    await this.prisma.oBSInstance.update({
      where: { clientId },
      data: {
        apiToken: token,
        tokenCreatedAt: new Date(),
      },
    });

    return token;
  }

  /**
   * Validate API token and return the associated OBS instance
   */
  async validateToken(token: string): Promise<{
    valid: boolean;
    instance?: any;
  }> {
    if (!token) {
      return { valid: false };
    }

    try {
      const instance = await this.prisma.oBSInstance.findUnique({
        where: { apiToken: token },
      });

      if (!instance) {
        return { valid: false };
      }

      // Update last used timestamp
      await this.prisma.oBSInstance.update({
        where: { id: instance.id },
        data: { tokenLastUsedAt: new Date() },
      });

      return { valid: true, instance };
    } catch (error) {
      console.error('Token validation error:', error);
      return { valid: false };
    }
  }

  /**
   * Extract token from WebSocket URL query parameters
   */
  extractTokenFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url, 'ws://dummy');
      return urlObj.searchParams.get('token');
    } catch (error) {
      return null;
    }
  }

  /**
   * Revoke (delete) an API token
   */
  async revokeToken(clientId: string): Promise<void> {
    await this.prisma.oBSInstance.update({
      where: { clientId },
      data: {
        apiToken: null,
        tokenCreatedAt: null,
        tokenLastUsedAt: null,
      },
    });
  }
}
