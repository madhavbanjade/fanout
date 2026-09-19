import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  hash = (password: string) => bcrypt.hash(password, 12);
  compare = (password: string, hash: string) => bcrypt.compare(password, hash);
}
