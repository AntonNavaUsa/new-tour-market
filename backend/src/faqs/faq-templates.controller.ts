import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FaqsService } from './faqs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('faq-templates')
@Controller('faq-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class FaqTemplatesController {
  constructor(private faqsService: FaqsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: list all FAQ templates' })
  findAll() {
    return this.faqsService.findAllTemplates();
  }

  @Post()
  @ApiOperation({ summary: 'Admin: create FAQ template' })
  create(
    @Body() data: { question: string; answer: string; sortOrder?: number },
  ) {
    return this.faqsService.createTemplate(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: update FAQ template' })
  update(
    @Param('id') id: string,
    @Body() data: { question?: string; answer?: string; sortOrder?: number },
  ) {
    return this.faqsService.updateTemplate(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: delete FAQ template' })
  remove(@Param('id') id: string) {
    return this.faqsService.removeTemplate(id);
  }
}
