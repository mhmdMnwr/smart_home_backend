import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from "@nestjs/mongoose";
import { Model } from 'mongoose';
import { History, HistoryDocument } from './schemas/history.schema';
import { CreateHistoryDto } from './dto/create-history.dto';

@Injectable ()
export class HistoryService {
constructor(
@InjectModel(History.name) private historyModel: Model<HistoryDocument>,
){}

  async create(createHistoryDto: CreateHistoryDto) {
    try {
      const createdHistory = new this.historyModel(createHistoryDto);
      await createdHistory.save();
      return { message: 'History element created successfully' };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message || 'An error occurred while creating the history element');
    }
  }

  async findOne(id: string) {
    try {
      return await this.historyModel.findById(id).exec();
    } catch (error: any) {
      throw new InternalServerErrorException('Error retrieving history element');
    }
  }

  async findByType(type: string, page: number, limit: number) {
    try {
      const normalizedType = this.normalizeType(type);
      const normalizedPage = this.normalizePage(page);
      const normalizedLimit = this.normalizeLimit(limit);
      const skip = (normalizedPage - 1) * normalizedLimit;
      const query = { type: normalizedType };

      const [data, total] = await Promise.all([
        this.historyModel
          .find(query)
          .sort({ createdAt: -1, _id: -1 })
          .skip(skip)
          .limit(normalizedLimit)
          .select({ _id: 0, value: 1, createdAt: 1 })
          .lean()
          .exec(),
        this.historyModel.countDocuments(query).exec(),
      ]);

      return {
        data: data.map((item) => ({
          value: item.value,
          createdAt: item.createdAt,
        })),
        total,
        page: normalizedPage,
        limit: normalizedLimit,
        totalPages: Math.ceil(total / normalizedLimit),
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Error retrieving history by type');
    }
  }

  async findByTypeAndDate(type: string, date: string, page: number, limit: number) {
    try {
      const normalizedType = this.normalizeType(type);
      const normalizedPage = this.normalizePage(page);
      const normalizedLimit = this.normalizeLimit(limit);
      const skip = (normalizedPage - 1) * normalizedLimit;

      const start = new Date(date);
      if (Number.isNaN(start.getTime())) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
      }

      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setUTCHours(23, 59, 59, 999);

      const query = { type: normalizedType, createdAt: { $gte: start, $lte: end } };

      const [data, total] = await Promise.all([
        this.historyModel
          .find(query)
          .sort({ createdAt: -1, _id: -1 })
          .skip(skip)
          .limit(normalizedLimit)
          .select({ _id: 0, value: 1, createdAt: 1 })
          .lean()
          .exec(),
        this.historyModel.countDocuments(query).exec(),
      ]);

      return {
        data: data.map((item) => ({
          value: item.value,
          createdAt: item.createdAt,
        })),
        total,
        page: normalizedPage,
        limit: normalizedLimit,
        totalPages: Math.ceil(total / normalizedLimit),
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Error retrieving history by type and date');
    }
  }

  private normalizeType(type: string): string {
    const normalizedType = type?.trim();

    if (!normalizedType) {
      throw new BadRequestException('Query parameter "type" is required');
    }

    return normalizedType;
  }

  private normalizePage(page: number): number {
    return Number.isFinite(page) && page > 0 ? page : 1;
  }

  private normalizeLimit(limit: number): number {
    return Number.isFinite(limit) && limit > 0 ? limit : 10;
  }
}