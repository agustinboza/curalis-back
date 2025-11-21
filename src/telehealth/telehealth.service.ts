import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FhirService } from '../fhir/fhir.service.js';
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



@Injectable()
export class TelehealthService {
  private readonly logger = new Logger(TelehealthService.name);
  private readonly client: ChimeSDKMeetingsClient;
  private readonly defaultMediaRegion: string;

  constructor(
    configService: ConfigService,
    private readonly fhir: FhirService,
  ) {
    this.defaultMediaRegion = configService.get<string>('aws.region') ?? process.env.AWS_REGION ?? 'us-east-1';
    this.client = new ChimeSDKMeetingsClient({ region: this.defaultMediaRegion });
  }

  async createSession(dto: CreateTelehealthSessionDto, user: any) {
    const sessionId = randomUUID();
    const mediaRegion = dto.mediaRegion || this.defaultMediaRegion;
    // Use doctor ID from token if available, otherwise fallback (should be enforced)
    const doctorExternalUserId = this.truncateExternalUserId(
      user.sub ?? dto.doctorExternalUserId ?? `doctor#${sessionId.slice(0, 8)}`,
    );

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

    // Persist session in FHIR Appointment
    const appointment = {
      resourceType: 'Appointment',
      status: 'booked',
      start: new Date().toISOString(),
      identifier: [
        { system: 'https://curalis.com/session-id', value: sessionId },
        { system: 'https://aws.amazon.com/chime/meeting-id', value: meeting.MeetingId },
      ],
      participant: [
        {
          actor: user.fhirRef ? { reference: user.fhirRef } : undefined,
          status: 'accepted',
        },
      ],
      // Store meeting details in comment for retrieval (simplified persistence)
      comment: JSON.stringify({
        meeting,
        doctorAttendee: attendee,
      }),
    };

    await this.fhir.create('Appointment', appointment);

    return {
      sessionId,
      joinInfo: this.buildJoinInfo(meeting, attendee),
    };
  }

  async joinSession(sessionId: string, dto: JoinTelehealthSessionDto, user: any) {
    // Find session in FHIR
    const bundle: any = await this.fhir.search('Appointment', {
      identifier: `https://curalis.com/session-id|${sessionId}`,
    });
    const appointment = bundle.entry?.[0]?.resource;

    if (!appointment) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const sessionData = appointment.comment ? JSON.parse(appointment.comment) : null;
    if (!sessionData || !sessionData.meeting) {
      throw new InternalServerErrorException('Session data corrupted');
    }

    const externalUserId = this.truncateExternalUserId(
      user.sub ?? dto.externalUserId ?? `patient#${sessionId.slice(0, 8)}-${randomUUID().slice(0, 4)}`,
    );

    this.logger.log(`Creating attendee for session ${sessionId} (meeting ${this.getMeetingId(sessionData.meeting)}) with external user ${externalUserId}`);
    const attendeeResponse = await this.client.send(
      new CreateAttendeeCommand({
        MeetingId: this.getMeetingId(sessionData.meeting),
        ExternalUserId: externalUserId,
      }),
    );

    if (!attendeeResponse.Attendee) {
      this.logger.error(`CreateAttendeeCommand returned without attendee for session ${sessionId}`);
      throw new InternalServerErrorException('Failed to create attendee');
    }

    this.logger.log(`Created attendee ${attendeeResponse.Attendee.AttendeeId} for session ${sessionId}`);

    // Update FHIR Appointment with new participant
    if (user.fhirRef) {
      appointment.participant.push({
        actor: { reference: user.fhirRef },
        status: 'accepted',
      });
      await this.fhir.update('Appointment', appointment.id, appointment);
    }

    return {
      sessionId,
      joinInfo: this.buildJoinInfo(sessionData.meeting, attendeeResponse.Attendee),
    };
  }

  async endSession(sessionId: string) {
    // Find session in FHIR
    const bundle: any = await this.fhir.search('Appointment', {
      identifier: `https://curalis.com/session-id|${sessionId}`,
    });
    const appointment = bundle.entry?.[0]?.resource;

    if (!appointment) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const sessionData = appointment.comment ? JSON.parse(appointment.comment) : null;
    const meetingId = sessionData?.meeting?.MeetingId;

    if (meetingId) {
      try {
        this.logger.log(`Deleting meeting ${meetingId} for session ${sessionId}`);
        await this.client.send(new DeleteMeetingCommand({ MeetingId: meetingId }));
        this.logger.log(`Deleted meeting ${meetingId} for session ${sessionId}`);
      } catch (error) {
        this.logger.warn(`Failed to delete meeting ${meetingId}: ${(error as Error).message}`);
      }
    }

    // Update FHIR Appointment status
    appointment.status = 'fulfilled'; // or 'cancelled'
    await this.fhir.update('Appointment', appointment.id, appointment);
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
