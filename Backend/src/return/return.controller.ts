import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ReturnService } from './return.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnStatusDto } from './dto/update-return-status.dto';
import { ProcessReturnItemDto } from './dto/process-return-item.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('returns')
// TODO: Re-enable guards when authentication is implemented
// @UseGuards(JwtAuthGuard, RolesGuard)
export class ReturnController {
  constructor(private readonly returnService: ReturnService) {}

  // ==========================================
  // ADMIN ENDPOINTS
  // ==========================================

  /**
   * Get all returns (admin only)
   * TODO: Add @Roles('ADMIN') when auth is ready
   */
  @Get()
  async getAllReturns(@Query('status') status?: string) {
    return await this.returnService.getAllReturns(status);
  }

  /**
   * Get return statistics (admin only)
   * TODO: Add @Roles('ADMIN') when auth is ready
   */
  @Get('stats')
  async getStats() {
    return await this.returnService.getReturnStats();
  }

  /**
   * Get return by ID (admin only)
   * TODO: Add @Roles('ADMIN') when auth is ready
   */
  @Get(':id')
  async getReturnById(@Param('id') id: string) {
    return await this.returnService.getReturnById(id);
  }

  /**
   * Update return status (admin only)
   * TODO: Add @Roles('ADMIN') when auth is ready
   */
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateReturnStatusDto,
  ) {
    return await this.returnService.updateReturnStatus(id, updateStatusDto);
  }

  /**
   * Process return item with action (admin only)
   * TODO: Add @Roles('ADMIN') when auth is ready
   */
  @Post('process-item')
  async processReturnItem(@Body() processDto: ProcessReturnItemDto) {
    return await this.returnService.processReturnItem(processDto);
  }

  /**
   * Create return (admin can create on behalf of users)
   * TODO: Add @Roles('ADMIN') when auth is ready
   */
  @Post()
  async createReturnAsAdmin(
    @Request() req,
    @Body() createReturnDto: CreateReturnDto,
  ) {
    const userId = String(req.headers['x-user-id'] || (req.body as any)?.userId || '').trim();
    if (!userId) {
      throw new BadRequestException('Utilisateur non authentifié');
    }
    return await this.returnService.createReturn(
      userId,
      createReturnDto,
    );
  }

  // ==========================================
  // ANIMATEUR / CLIENT ENDPOINTS
  // ==========================================

  /**
   * Get my returns (animateur/client)
   * TODO: Add @Roles('ANIMATEUR', 'CLIENT') when auth is ready
   * For now, requires userId in query params
   */
  @Get('my/returns')
  async getMyReturns(@Query('userId') userId: string) {
    return await this.returnService.getMyReturns(userId);
  }

  /**
   * Request a return (animateur/client)
   * TODO: Add @Roles('ANIMATEUR', 'CLIENT') when auth is ready
   */
  @Post('request')
  async requestReturn(
    @Request() req,
    @Body() createReturnDto: CreateReturnDto,
  ) {
    const userId = String(req.headers['x-user-id'] || (req.body as any)?.userId || '').trim();
    if (!userId) {
      throw new BadRequestException('Utilisateur non authentifié');
    }
    return await this.returnService.createReturn(
      userId,
      createReturnDto,
    );
  }

  /**
   * Get specific return details (own returns only)
   * TODO: Add @Roles('ANIMATEUR', 'CLIENT') when auth is ready
   * For now, no ownership validation
   */
  @Get('my/:id')
  async getMyReturnById(@Param('id') id: string) {
    return await this.returnService.getReturnById(id);
  }
}
