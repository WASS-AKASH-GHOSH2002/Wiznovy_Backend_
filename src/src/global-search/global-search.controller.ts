import { Controller, Get,  Query, } from '@nestjs/common';
import { GlobalSearchService } from './global-search.service';
import { GlobalSearchDto } from './dto/global-search.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Account } from 'src/account/entities/account.entity';
import { ApiOperation } from '@nestjs/swagger';


@Controller('global-search')
export class GlobalSearchController {
  constructor(private readonly globalSearchService: GlobalSearchService) {}

  @Get()
  async search(@Query() dto: GlobalSearchDto, @CurrentUser() account?: Account) {
    return this.globalSearchService.search(dto, account?.id);
  }

  @Get('suggestions')
@ApiOperation({ summary: 'Get autocomplete-style search suggestions' })
async getSearchSuggestions(@Query('keyword') keyword: string) {
  return this.globalSearchService.getSearchSuggestions(keyword);
}

 

    @Get('subject-total-count')
  async getSubjectTotalCount() {
    return this.globalSearchService.getTotalCountPerSubject();
  }

    @Get('tutor-per-country')
  async getTutorPerCountry() {
    return this.globalSearchService.getTutorCountPerCountry();
  }

  
  @Get('expertise-count')
  async getExpertiseLevelCount() {
    return await this.globalSearchService.getExpertiseLevelCount();
  }


 
}
