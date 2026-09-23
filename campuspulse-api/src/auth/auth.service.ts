import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { DatabaseService } from "../database/database.service";
import { LoginDto, RegisterDto } from "./auth.dto";

type Row = { id: string; name: string; email: string; role: "student" | "admin"; password_hash: string };

@Injectable()
export class AuthService {
  constructor(private db: DatabaseService, private jwt: JwtService) {}

  private async session(u: Pick<Row, "id" | "name" | "email" | "role">) {
    const token = await this.jwt.signAsync({ sub: u.id, role: u.role, name: u.name, email: u.email });
    return { token, user: { name: u.name, email: u.email, role: u.role } };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const exists = await this.db.query("SELECT 1 FROM users WHERE lower(email) = $1", [email]);
    if (exists.rowCount > 0) throw new ConflictException("An account with this email already exists. Log in instead.");

    const hash = await bcrypt.hash(dto.password, 10);
    // NOTE: admin self-signup mirrors the UI in the design. Before production, make admin accounts invite-only.
    const { rows } = await this.db.query<Row>(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, password_hash`,
      [dto.name.trim(), email, hash, dto.role],
    );
    return this.session(rows[0]);
  }

  async login(dto: LoginDto) {
    const { rows } = await this.db.query<Row>(
      "SELECT id, name, email, role, password_hash FROM users WHERE lower(email) = $1",
      [dto.email.trim().toLowerCase()],
    );
    const u = rows[0];
    // same message for unknown email and wrong password, so accounts can't be probed
    if (!u || !(await bcrypt.compare(dto.password, u.password_hash))) {
      throw new UnauthorizedException("Email or password is incorrect.");
    }
    if (u.role !== dto.role) {
      throw new UnauthorizedException(`This account is registered as ${u.role}. Switch the role and try again.`);
    }
    return this.session(u);
  }
}
