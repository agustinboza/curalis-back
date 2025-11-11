import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import {
  Attendee,
  ChimeSDKMeetingsClient,
  CreateAttendeeCommand,
  CreateMeetingWithAttendeesCommand,
  DeleteMeetingCommand,
  Meeting,
} from '@aws-sdk/client-chime-sdk-meetings';
import { CreateTelehealthSessionDto } from './dto/create-telehealth-session.dto.js';
import { JoinTelehealthSessionDto } from './dto/join-telehealth-session.dto.js';

type JoinInfo = {
  Meeting: Meeting;
  Attendee: Attendee;
};

type TelehealthSessionRecord = {
  sessionId: string;
  meeting: Meeting;
  doctorAttendee: Attendee;
  createdAt: Date;
};

@Injectable()
export class TelehealthService {
  private readonly logger = new Logger(TelehealthService.name);
  private readonly client: ChimeSDKMeetingsClient;
  private readonly sessions = new Map<string, TelehealthSessionRecord>();
  private readonly defaultMediaRegion: string;

  constructor(configService: ConfigService) {
    this.defaultMediaRegion = configService.get<string>('aws.region') ?? process.env.AWS_REGION ?? 'us-east-1';
    this.client = new ChimeSDKMeetingsClient({ region: this.defaultMediaRegion });
  }

  async createSession(dto: CreateTelehealthSessionDto) {
    const sessionId = randomUUID();
    const mediaRegion = dto.mediaRegion || this.defaultMediaRegion;
    const doctorExternalUserId = this.truncateExternalUserId(dto.doctorExternalUserId ?? `doctor#${sessionId.slice(0, 8)}`);

    this.logger.log(`Creating meeting for session ${sessionId} in region ${mediaRegion}`);
    const response = await this.client.send(
      new CreateMeetingWithAttendeesCommand({
        ClientRequestToken: sessionId,
        MediaRegion: mediaRegion,
        ExternalMeetingId: sessionId.replace(/-/g, '').slice(0, 64),
        Attendees: [
          {
            ExternalUserId: doctorExternalUserId,
          },
        ],
      }),
    );

    const meeting = response.Meeting;
    const attendee = response.Attendees?.[0];
    if (!meeting || !attendee) {
      this.logger.error('CreateMeetingWithAttendeesCommand succeeded without meeting/attendee');
      throw new InternalServerErrorException('Failed to create meeting');
    }
    if (!meeting.MeetingId) {
      this.logger.error('MeetingId missing from meeting payload');
      throw new InternalServerErrorException('MeetingId missing in response');
    }

    this.logger.log(`Created meeting ${meeting.MeetingId} for session ${sessionId}`);
    this.sessions.set(sessionId, {
      sessionId,
      meeting,
      doctorAttendee: attendee,
      createdAt: new Date(),
    });

    return {
      sessionId,
      joinInfo: this.buildJoinInfo(meeting, attendee),
    };
  }

  async joinSession(sessionId: string, dto: JoinTelehealthSessionDto) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const externalUserId = this.truncateExternalUserId(
      dto.externalUserId ?? `patient#${sessionId.slice(0, 8)}-${randomUUID().slice(0, 4)}`,
    );

    this.logger.log(`Creating attendee for session ${sessionId} (meeting ${this.getMeetingId(session.meeting)}) with external user ${externalUserId}`);
    const attendeeResponse = await this.client.send(
      new CreateAttendeeCommand({
        MeetingId: this.getMeetingId(session.meeting),
        ExternalUserId: externalUserId,
      }),
    );

    if (!attendeeResponse.Attendee) {
      this.logger.error(`CreateAttendeeCommand returned without attendee for session ${sessionId}`);
      throw new InternalServerErrorException('Failed to create attendee');
    }

    this.logger.log(`Created attendee ${attendeeResponse.Attendee.AttendeeId} for session ${sessionId}`);
    return {
      sessionId,
      joinInfo: this.buildJoinInfo(session.meeting, attendeeResponse.Attendee),
    };
  }

  async endSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const meetingId = this.getMeetingId(session.meeting, false);
    if (meetingId) {
      try {
        this.logger.log(`Deleting meeting ${meetingId} for session ${sessionId}`);
        await this.client.send(new DeleteMeetingCommand({ MeetingId: meetingId }));
        this.logger.log(`Deleted meeting ${meetingId} for session ${sessionId}`);
      } catch (error) {
        this.logger.warn(`Failed to delete meeting ${meetingId}: ${(error as Error).message}`);
      }
    }

    this.sessions.delete(sessionId);
  }

  private buildJoinInfo(meeting: Meeting, attendee: Attendee): JoinInfo {
    return {
      Meeting: meeting,
      Attendee: attendee,
    };
  }

  private truncateExternalUserId(value: string): string {
    return value.length <= 64 ? value : value.slice(0, 64);
  }

  private getMeetingId(meeting: Meeting, strict = true): string | undefined {
    const meetingId = meeting.MeetingId;
    if (!meetingId && strict) {
      this.logger.error('MeetingId missing when required');
      throw new InternalServerErrorException('MeetingId missing in session');
    }
    return meetingId;
  }
}
