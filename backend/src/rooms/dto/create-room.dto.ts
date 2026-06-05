import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoomDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string;
}
