import { Ability } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Account } from 'src/account/entities/account.entity';
import { PermissionAction } from 'src/enum';
import { AuthService } from '../auth.service';
export type PermissionObjectType = any;
export type AppAbility = Ability<[PermissionAction, PermissionObjectType]>;
interface CaslPermission {
  action: PermissionAction;
  // In our database, Invoice, Project... are called "object"
  // but in CASL they are called "subject"
  subject: string;
}

@Injectable()
export class CaslAbilityFactory {
  constructor(private authService: AuthService) {}
  async createForUser(user: Account): Promise<AppAbility> {
    const dbPermissions = await this.authService.findPermission(user.id);
    const caslPermissions: CaslPermission[] = dbPermissions.map((p) => ({
      action: p['permission']['name'],
      subject: p['menu']['name'],
    }));
    return new Ability<[PermissionAction, PermissionObjectType]>(
      caslPermissions,
    );
  }
}
