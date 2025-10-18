import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { UpdateInstanceDto } from './dto/update-instance.dto';
import { Prisma } from '../../generated/prisma';

@Injectable()
export class OBSInstanceService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInstanceDto) {
    try {
      return await this.prisma.oBSInstance.create({
        data: {
          clientId: dto.clientId,
          name: dto.name,
          location: dto.location,
          description: dto.description,
          capacity: dto.capacity || 1,
          metadata: dto.metadata || {},
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Instance with clientId '${dto.clientId}' already exists`,
          );
        }
      }
      throw error;
    }
  }

  async findAll(status?: string, page = 1, limit = 20) {
    const where: Prisma.OBSInstanceWhereInput = status ? { status } : {};

    const [instances, total] = await Promise.all([
      this.prisma.oBSInstance.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.oBSInstance.count({ where }),
    ]);

    return {
      instances,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const instance = await this.prisma.oBSInstance.findUnique({
      where: { id },
    });

    if (!instance) {
      throw new NotFoundException('Instance not found');
    }

    return instance;
  }

  async findByClientId(clientId: string) {
    return this.prisma.oBSInstance.findUnique({
      where: { clientId },
    });
  }

  async update(id: string, dto: UpdateInstanceDto) {
    try {
      return await this.prisma.oBSInstance.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Instance not found');
        }
      }
      throw error;
    }
  }

  async delete(id: string) {
    try {
      await this.prisma.oBSInstance.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Instance not found');
        }
      }
      throw error;
    }
  }

  async updateStatus(
    clientId: string,
    status: 'online' | 'offline' | 'busy',
    additional?: {
      isStreaming?: boolean;
      isRecording?: boolean;
      currentScene?: string;
      scenes?: string[];
      connectedAt?: Date;
      lastSeenAt?: Date;
    },
  ) {
    const instance = await this.findByClientId(clientId);
    if (!instance) {
      // Instance not registered yet - skip update
      return null;
    }

    return this.prisma.oBSInstance.update({
      where: { clientId },
      data: {
        status,
        ...additional,
      },
    });
  }

  async getStats() {
    const [total, online, offline, busy, streaming, recording] = await Promise.all([
      this.prisma.oBSInstance.count(),
      this.prisma.oBSInstance.count({ where: { status: 'online' } }),
      this.prisma.oBSInstance.count({ where: { status: 'offline' } }),
      this.prisma.oBSInstance.count({ where: { status: 'busy' } }),
      this.prisma.oBSInstance.count({ where: { isStreaming: true } }),
      this.prisma.oBSInstance.count({ where: { isRecording: true } }),
    ]);

    return { total, online, offline, busy, streaming, recording };
  }
}
