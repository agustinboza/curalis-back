export class FollowUpResponseDto {
  id!: string;
  type!: string;
  date!: string;
  status!: 'pending' | 'completed';
  weight?: number;
  wellnessScore?: number;
}

