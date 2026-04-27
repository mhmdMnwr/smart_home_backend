import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { HistoryService } from './history.service';
import { CreateHistoryDto } from './dto/create-history.dto';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Post()
  create(@Body() createHistoryDto: CreateHistoryDto) {
    return this.historyService.create(createHistoryDto);
  }

  @Get()
  findUserHistoryByType(
    @Query('type') type: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.historyService.findByType(type, +page, +limit);
  }

  @Get('type/:type')
  findByTypeLegacyRoute(
    @Param('type') type: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.historyService.findByType(type, +page, +limit);
  }

  @Get('type/:type/date/:date')
  findByTypeAndDate(
    @Param('type') type: string,
    @Param('date') date: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.historyService.findByTypeAndDate(type, date, +page, +limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.historyService.findOne(id);
  }

}
