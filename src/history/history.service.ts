import { Injectable, InternalServerErrorException } from "@nestjs/common";
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
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.historyModel.find({ type }).skip(skip).limit(limit).exec(),
        this.historyModel.countDocuments({ type }).exec()
      ]);
      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new InternalServerErrorException('Error retrieving history by type');
    }
  }

  async findByTypeAndDate(type: string, date: string, page: number, limit: number) {
    try {
      const skip = (page - 1) * limit;
      const start = new Date(date);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setUTCHours(23, 59, 59, 999);

      const query = { type, createdAt: { $gte: start, $lte: end } };

      const [data, total] = await Promise.all([
        this.historyModel.find(query).skip(skip).limit(limit).exec(),
        this.historyModel.countDocuments(query).exec()
      ]);
      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      throw new InternalServerErrorException('Error retrieving history by type and date');
    }
  }
}