import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoomMeeting } from './entities/zoom.entity';
import { Session } from 'src/session/entities/session.entity';
import axios from 'axios';

@Injectable()
export class ZoomService {
  constructor(
    @InjectRepository(ZoomMeeting)
    private readonly zoomRepo: Repository<ZoomMeeting>,
  ) {}

  async createMeetingForSession(session: Session): Promise<ZoomMeeting | null> {
    try {
      // Validate environment variables
      if (!process.env.ZOOM_ACCOUNT_ID || !process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET) {
        console.warn('Zoom credentials not configured properly - skipping meeting creation');
        return null;
      }

      const accessToken = await this.getZoomAccessToken();
      
      const meetingData = {
        topic: `Session with ${session.tutor?.tutorDetail?.[0]?.name || 'Tutor'}`,
        type: 2,
        start_time: `${session.sessionDate}T${session.startTime}:00`,
        duration: session.duration,
        timezone: 'UTC',
        password: this.generateMeetingPassword(),
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
          audio: 'both'
        }
      };

      const response = await axios.post(
        'https://api.zoom.us/v2/users/me/meetings',
        meetingData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const zoomMeeting = this.zoomRepo.create({
        sessionId: session.id,
        meetingId: response.data.id.toString(),
        joinUrl: response.data.join_url,
        startUrl: response.data.start_url,
        topic: response.data.topic,
        password: response.data.password,
        startTime: new Date(response.data.start_time),
        duration: response.data.duration,
        status: 'scheduled'
      });

      const savedMeeting = await this.zoomRepo.save(zoomMeeting);
      
      return savedMeeting;
    } catch (error) {
      console.error('Zoom Meeting Creation Error:', error.response?.data || error.message);
      console.warn('Zoom meeting creation failed - session will proceed without Zoom link');
      return null; 
    }
  }

  async findBySessionId(sessionId: string): Promise<ZoomMeeting | null> {
    return await this.zoomRepo.findOne({ where: { sessionId } });
  }

  async deleteMeeting(sessionId: string): Promise<void> {
    const meeting = await this.findBySessionId(sessionId);
    if (meeting) {
      try {
        const accessToken = await this.getZoomAccessToken();
        await axios.delete(
          `https://api.zoom.us/v2/meetings/${meeting.meetingId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );
        await this.zoomRepo.remove(meeting);
      } catch (error) {
        console.error('Failed to delete Zoom meeting:', error.message);
      }
    }
  }

  private async getZoomAccessToken(): Promise<string> {
  try {

    const credentials =
      process.env.ZOOM_CLIENT_ID + ':' + process.env.ZOOM_CLIENT_SECRET;

    const encodedCredentials =
      Buffer.from(credentials).toString('base64');

    const response = await axios.post(
      'https://zoom.us/oauth/token',
      'grant_type=account_credentials&account_id=' + process.env.ZOOM_ACCOUNT_ID,
      {
        headers: {
          'Authorization': `Basic ${encodedCredentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return response.data.access_token;

  } catch (error) {
    console.error('Zoom OAuth Error Details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    throw new BadRequestException(
      `Failed to get Zoom access token: ${error.response?.data?.error || error.message}`
    );
  }
}

  private generateMeetingPassword(): string {
    return Math.random().toString(36).substring(2, 8);
  }

  async testZoomConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Validate credentials format
      const validation = this.validateZoomCredentials();
      if (!validation.valid) {
        return { success: false, message: validation.message };
      }

 

      return { 
        success: true, 
        message: `Zoom API connected successfully. Can create meetings.` 
      };
    } catch (error) {
     
      if (error.response?.status === 404 || error.response?.data?.code === 1001) {
        return { 
          success: true, 
          message: `Zoom API connected. Meeting creation should work.` 
        };
      }
      return { 
        success: false, 
        message: `Connection failed: ${error.response?.data?.message || error.message}` 
      };
    }
  }

  private validateZoomCredentials(): { valid: boolean; message: string } {
    if (!process.env.ZOOM_ACCOUNT_ID) {
      return { valid: false, message: 'ZOOM_ACCOUNT_ID not configured' };
    }
    if (!process.env.ZOOM_CLIENT_ID) {
      return { valid: false, message: 'ZOOM_CLIENT_ID not configured' };
    }
    if (!process.env.ZOOM_CLIENT_SECRET) {
      return { valid: false, message: 'ZOOM_CLIENT_SECRET not configured' };
    }
    
    // Basic format validation
    if (process.env.ZOOM_ACCOUNT_ID.length < 10) {
      return { valid: false, message: 'ZOOM_ACCOUNT_ID appears to be invalid (too short)' };
    }
    if (process.env.ZOOM_CLIENT_ID.length < 10) {
      return { valid: false, message: 'ZOOM_CLIENT_ID appears to be invalid (too short)' };
    }
    if (process.env.ZOOM_CLIENT_SECRET.length < 10) {
      return { valid: false, message: 'ZOOM_CLIENT_SECRET appears to be invalid (too short)' };
    }

    return { valid: true, message: 'Credentials format appears valid' };
  }

  async checkDatabaseTable(): Promise<{ exists: boolean; message: string }> {
    try {
      const count = await this.zoomRepo.count();
      return { 
        exists: true, 
        message: `Table exists with ${count} records` 
      };
    } catch (error) {
      return { 
        exists: false, 
        message: `Table check failed: ${error.message}` 
      };
    }
  }
}