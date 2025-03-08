import { Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { Narr8Module } from "src/features/narr8/narr8.module";

@Module({
  imports: [CommonModule, Narr8Module],
  controllers: [],
})
export class AppModule {}
