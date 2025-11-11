import { IsArray, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class WorkingHourItemDto {
  @IsString()
  @IsIn(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'])
  dayOfWeek!: 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

  @IsNumber()
  @Min(0)
  @Max(24 * 60)
  startMinutes!: number;

  @IsNumber()
  @Min(0)
  @Max(24 * 60)
  endMinutes!: number;
}

export class SetWorkingHoursDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHourItemDto)
  hours!: WorkingHourItemDto[];

  @IsOptional()
  @IsString()
  doctorId?: string;
}


