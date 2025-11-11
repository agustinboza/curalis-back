import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateAssignedExamStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['pending', 'active', 'completed'])
  status!: 'pending' | 'active' | 'completed';
}


