import { JwtService } from '@nestjs/jwt';
import { SelectQueryBuilder } from 'typeorm';

export default class APIFeatures {
  static async assignJwtToken(
    userId: string,
    jwtService: JwtService,
  ): Promise<string> {
    return jwtService.sign({ id: userId });
  }
}

export function apiFeatures<T>(queryBuilder: SelectQueryBuilder<T>, dto: any) {
  if (dto.keyword) {
    queryBuilder.andWhere(
      `CONCAT(${queryBuilder.alias}.name, ' ', ${queryBuilder.alias}.description) LIKE :keyword`,
      { keyword: `%${dto.keyword}%` }
    );
  }

  return queryBuilder
    .orderBy({ [`${queryBuilder.alias}.createdAt`]: 'DESC' })
    .skip(dto.offset)
    .take(dto.limit)
    .getManyAndCount()
    .then(([result, total]) => ({ result, total }));
}
