import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TutorAvailability } from './entities/tutor-availability.entity';
import { TutorDetail } from '../tutor-details/entities/tutor-detail.entity';
import { Session } from '../session/entities/session.entity';
import { TutorBlock } from '../tutor-block/entities/tutor-block.entity';
import { CreateAvailabilityDto, AvailabilityPaginationDto, BlockSlotDto } from './dto/create-availability.dto';
import { DefaultStatus, SessionStatus } from 'src/enum';
import { SettingsService } from 'src/settings/settings.service';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter)




@Injectable()
export class TutorAvailabilityService {
  constructor(
    @InjectRepository(TutorAvailability)
    private readonly availabilityRepo: Repository<TutorAvailability>,
    @InjectRepository(TutorDetail)
    private readonly tutorRepo: Repository<TutorDetail>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    @InjectRepository(TutorBlock)
    private readonly blockRepo: Repository<TutorBlock>,
    private readonly settingsService: SettingsService,
  ) {}

  async create(dto: CreateAvailabilityDto, tutorId: string) {
  const overlapping = await this.availabilityRepo
    .createQueryBuilder('availability')
    .where('availability.tutorId = :tutorId', { tutorId })
    .andWhere('availability.dayOfWeek = :dayOfWeek', { dayOfWeek: dto.dayOfWeek })
    .andWhere('availability.status = :status', { status: DefaultStatus.ACTIVE })
    .andWhere(
      
      '(availability.startTime < :endTime AND availability.endTime > :startTime)',
      { startTime: dto.startTime, endTime: dto.endTime },
    )
    .getOne();

  if (overlapping) {
    throw new ConflictException(
      `Time slot overlaps with existing availability (${overlapping.startTime} - ${overlapping.endTime})`,
    );
  }

  
  const availability = this.availabilityRepo.create({
    tutorId,
    dayOfWeek: dto.dayOfWeek,
    startTime: dto.startTime,
    endTime: dto.endTime,
    status: DefaultStatus.ACTIVE,
  });

 
  return await this.availabilityRepo.save(availability);
}


 async findByTutor(accountId: string, dto: AvailabilityPaginationDto) {
  
  
  const tutor = await this.tutorRepo.findOne({ where: { accountId } });
  if (!tutor) {
    throw new NotFoundException('Tutor not found');
  }
  


  const { status, offset = 0, limit = 10 } = dto;

  const queryBuilder = this.availabilityRepo.createQueryBuilder('availability')
    .where('availability.tutorId = :tutorId', { tutorId: accountId })
    .andWhere('availability.status = :status', {
      status: status || DefaultStatus.ACTIVE,
    })
    .orderBy(
      `FIELD(availability.dayOfWeek, 
        "MONDAY", "TUESDAY", "WEDNESDAY", 
        "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY")`,
    )
    .addOrderBy('availability.startTime', 'ASC')
    .skip(offset)
    .take(limit);

  const [result, total] = await queryBuilder.getManyAndCount();
 

  return {
    total,
    limit,
    offset,
    result,
  };
}






  async getAvailableBookingSlots(tutorId: string, date: string) {
    const dayOfWeek = dayjs(date).format('dddd').toUpperCase();
    
    const tutor = await this.tutorRepo.findOne({
      where: { accountId: tutorId }
    });
    
    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }
    
    const availabilities = await this.availabilityRepo
      .createQueryBuilder('availability')
      .where('availability.tutorId = :tutorId', { tutorId: tutorId })
      .andWhere('UPPER(availability.dayOfWeek) = :dayOfWeek', { dayOfWeek })
      .andWhere('availability.status = :status', { status: DefaultStatus.ACTIVE })
      .orderBy('availability.startTime', 'ASC')
      .getMany();

    if (!availabilities.length) {
      return { message: 'Tutor is not available on this day', slots: [] };
    }

    const bookedSlots = await this.sessionRepo
  .createQueryBuilder('session')
  .where('session.tutorId = :tutorId', { tutorId })
  .andWhere('DATE(session.sessionDate) = :date', { date })
  .andWhere('session.status IN (:...statuses)', { 
    statuses: [ SessionStatus.SCHEDULED] 
  })
  .getMany();

    const blockedSlots = await this.blockRepo.find({
      where: {
        tutorId: tutorId,
        blockDate: new Date(date),
        status: DefaultStatus.ACTIVE
      }
    });

    const sessionSettings = await this.settingsService.getSessionSettings();
    const bufferMinutes = sessionSettings?.session_buffer_minutes ?? 15;

    const allSlots = availabilities.flatMap((availability) => {
      const slots = this.calculateTimeSlots(
        availability.startTime,
        availability.endTime,
        60,
        bufferMinutes,
      );

      return slots
        .filter(slot =>
          !this.isSlotBooked(slot.start, slot.end, bookedSlots) &&
          !this.isSlotBlocked(slot.start, slot.end, blockedSlots)
        )
        .map((slot) => ({
          ...slot,
          availabilityId: availability.id,
          dayOfWeek: availability.dayOfWeek,
          sessionDuration: 60,
          bufferTime: 15,
          price: this.calculateSessionPrice(tutor.hourlyRate, 60),
        }));
    });

    return {
      tutorId,
      date,
      sessionDuration: 60,
      bufferTime: 15,
      totalSlots: allSlots.length,
      slots: allSlots
    };
  }



 private calculateTimeSlots(
  startTime: string,
  endTime: string,
  duration: number,
  buffer: number,
): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];

 
  const toMinutes = (time: string): number => {
    const [h, m, s] = time.split(':').map(Number);
    return h * 60 + m + (s ? s / 60 : 0);
  };

  
  const toTimeString = (mins: number): string => {
    const hours = Math.floor(mins / 60)
      .toString()
      .padStart(2, '0');
    const minutes = (mins % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const start = toMinutes(startTime);
  const end = toMinutes(endTime);

  let current = start;

  while (current + duration <= end) {
    const slotStart = toTimeString(current);
    const slotEnd = toTimeString(current + duration);

    slots.push({ start: slotStart, end: slotEnd });
    current += duration + buffer; 
  }

  return slots;
}
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private normalizeTime(time: string): string {
   
    const parts = time.split(':');
    return `${parts[0]}:${parts[1]}`;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  async update(id: string, dto: Partial<CreateAvailabilityDto>, accountId: string) {
    const tutor = await this.tutorRepo.findOne({ where: { accountId } });
    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    const availability = await this.availabilityRepo.findOne({
      where: { id, tutorId: accountId }
    });

    if (!availability) {
      throw new NotFoundException('Availability not found');
    }

    Object.assign(availability, dto);
    return this.availabilityRepo.save(availability);
  }

  async remove(id: string, accountId: string) {
    const tutor = await this.tutorRepo.findOne({ where: { accountId } });
    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    const availability = await this.availabilityRepo.findOne({
      where: { id, tutorId: accountId }
    });

    if (!availability) {
      throw new NotFoundException('Availability not found');
    }

    availability.status = DefaultStatus.DELETED;
    return this.availabilityRepo.save(availability);
  }

  async blockSlot(dto: BlockSlotDto, accountId: string) {
    const tutor = await this.tutorRepo.findOne({ where: { accountId } });
    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    const block = this.blockRepo.create({
      tutorId: accountId,
      blockDate: new Date(dto.blockDate),
      startTime: dto.startTime,
      endTime: dto.endTime,
      reason: dto.reason,
      status: DefaultStatus.ACTIVE
    });

    return await this.blockRepo.save(block);
  }

  async findTutorBlocks(accountId: string) {
    const tutor = await this.tutorRepo.findOne({ where: { accountId } });
    if (!tutor) throw new NotFoundException('Tutor not found');

    return await this.blockRepo.find({
      where: { tutorId: accountId, status: DefaultStatus.ACTIVE },
      order: { blockDate: 'ASC', startTime: 'ASC' }
    });
  }

  async unblockSlot(id: string, accountId: string) {
    const block = await this.blockRepo.findOne({ where: { id, tutorId: accountId } });
    if (!block) throw new NotFoundException('Blocked slot not found');
    block.status = DefaultStatus.DELETED;
    return this.blockRepo.save(block);
  }

  private isSlotBooked(slotStart: string, slotEnd: string, bookedSlots: Session[]): boolean {
    return bookedSlots.some(booked => {
      const normalizedBookedStart = this.normalizeTime(booked.startTime);
      const normalizedBookedEnd = this.normalizeTime(booked.endTime);
      
      const bookedStart = this.timeToMinutes(normalizedBookedStart);
      const bookedEnd = this.timeToMinutes(normalizedBookedEnd);
      const slotStartMin = this.timeToMinutes(slotStart);
      const slotEndMin = this.timeToMinutes(slotEnd);
      
      return slotStartMin < bookedEnd && slotEndMin > bookedStart;
    });
  }

  private isSlotBlocked(slotStart: string, slotEnd: string, blockedSlots: TutorBlock[]): boolean {
    return blockedSlots.some(block => {
      const blockStart = this.timeToMinutes(block.startTime);
      const blockEnd = this.timeToMinutes(block.endTime);
      const slotStartMin = this.timeToMinutes(slotStart);
      const slotEndMin = this.timeToMinutes(slotEnd);
      
      return slotStartMin < blockEnd && slotEndMin > blockStart;
    });
  }

 private calculateSessionPrice(hourlyRate: number, durationMinutes: number): number {
  const hourlyFraction = durationMinutes / 60;
  const price = hourlyRate * hourlyFraction;
  return Number(price.toFixed(2));
}
}

