import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // ============= PRODUCTS =============
  @Get()
  getAllProducts(
    @Query('categoryId', new ParseIntPipe({ optional: true })) categoryId?: number,
    @Query('color') color?: string,
    @Query('includeInactive') includeInactive?: string,
    @Query('trash') trash?: string,
  ) {
    return this.productService.getAllProducts(
      categoryId,
      color,
      includeInactive === 'true',
      trash === 'true'
    );
  }

  @Get('colors')
  getAvailableColors() {
    return this.productService.getAvailableColors();
  }

  @Get('sizes')
  getAvailableSizes() {
    return this.productService.getAvailableSizes();
  }

  @Get('category/:categoryId')
  getProductsByCategory(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.productService.getProductsByCategory(categoryId);
  }

  @Get('code/:code')
  getProductByCode(@Param('code') code: string) {
    return this.productService.getProductByCode(code);
  }

  @Get(':id')
  getProductById(@Param('id', ParseIntPipe) id: number) {
    return this.productService.getProductById(id);
  }

  @Post()
  createProduct(@Body() dto: any) {
    return this.productService.createProduct(dto);
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `product-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    
    console.log('✅ File uploaded:', file.filename, 'Size:', file.size);
    
    // Return both relative path (for prod) and full URL (for dev)
    const imagePath = `/uploads/products/${file.filename}`;
    const imageUrl = `http://localhost:3001${imagePath}`;
    
    console.log('📸 Image URL:', imageUrl);
    
    return { imageUrl, imagePath };
  }

  @Put(':id')
  updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
    return this.productService.updateProduct(id, dto);
  }

  @Delete(':id')
  deleteProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() body?: { adminId?: string },
  ) {
    return this.productService.deleteProduct(id, body?.adminId);
  }

  // ============= TRASH / DELETION HISTORY =============
  @Get('trash/list')
  getTrashProducts() {
    return this.productService.getTrashProducts();
  }

  @Post(':id/restore')
  restoreProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productService.restoreProduct(id);
  }

  @Delete(':id/permanent')
  permanentDeleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productService.permanentDeleteProduct(id);
  }

  @Delete(':id/permanent-with-orders')
  forceDeleteProductWithOrders(@Param('id', ParseIntPipe) id: number) {
    return this.productService.forceDeleteProductWithOrders(id);
  }

  // ============= VARIANTS =============
  @Get('variant/:id')
  getVariantById(@Param('id', ParseIntPipe) id: number) {
    return this.productService.getVariantById(id);
  }

  @Post('variant')
  createVariant(@Body() dto: any) {
    return this.productService.createVariant(dto);
  }

  @Post('variant/:id/stock')
  updateVariantStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { quantity: number; reason?: string },
  ) {
    return this.productService.updateVariantStock(id, dto.quantity, dto.reason);
  }

  @Get('variant/:id/stock')
  getVariantStock(@Param('id', ParseIntPipe) id: number) {
    return this.productService.getVariantStock(id);
  }
}
