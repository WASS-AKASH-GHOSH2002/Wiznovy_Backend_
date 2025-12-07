import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class CreateUserPermissionDto {
  @IsNotEmpty()
  @IsUUID()
  accountId: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Type(() => Number)
  menuId: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Type(() => Number)
  permissionId: number;
}

export class PermissionDto {
  @IsNotEmpty()
  id: number;
}

export class UserPermissionDto {
  @IsNotEmpty()
  id: number;

  @IsNotEmpty()
  @IsUUID()
  accountId: string;

  @IsNotEmpty()
  menuId: number;

  @IsNotEmpty()
  permissionId: number;

  @IsNotEmpty()
  @IsBoolean()
  status: boolean;

  @IsNotEmpty()
  permission: PermissionDto;
}

export class MenuDto {
  @IsNotEmpty()
  id: number;

  @IsNotEmpty()
  userPermission: UserPermissionDto[];
}

export class UpdatePermissionDto {
  @IsNotEmpty()
  menu: MenuDto[];
}

export class UpdateUserPermissionDto {
  @IsNotEmpty()
  id: number;

  @IsNotEmpty()
  @IsUUID()
  accountId: string;

  @IsNotEmpty()
  menuId: number;

  @IsNotEmpty()
  permissionId: number;

  @IsNotEmpty()
  @IsBoolean()
  status: boolean;
}
