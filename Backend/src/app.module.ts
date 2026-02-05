import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientController } from './client/client.controller';
import { ClientModule } from './client/client.module';
import { ClientService } from './client/client.service';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { AnimateurModule } from './animateur/animateur.module';
import { CustomOrderModule } from './custom-order/custom-order.module';
import { ReturnModule } from './return/return.module';
import { CarouselModule } from './carousel/carousel.module';
import { UploadsModule } from './uploads/uploads.module';
import { PersonalizationModule } from './personalization/personalization.module';
import { TemplatesModule } from './templates/templates.module';

@Module({
  imports: [
    ClientModule,
    ProductModule,
    CategoryModule,
    CartModule,
    OrderModule,
    AnimateurModule,
    CustomOrderModule,
    ReturnModule,
    CarouselModule,
    UploadsModule,
    PersonalizationModule,
    TemplatesModule,
  ],
  controllers: [AppController, ClientController],
  providers: [AppService, ClientService],
})
export class AppModule {}
