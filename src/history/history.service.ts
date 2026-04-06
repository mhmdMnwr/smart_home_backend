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
}