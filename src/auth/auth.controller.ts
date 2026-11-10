import { Body, Controller, Get, Post , Request , UseGuards} from '@nestjs/common';
import { Roles } from './roles.decorator.js';
import { RolesGuard } from './roles.guard.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('test')
  testAuth() {
    return this.authService.testAuth();
  }

@Get('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
getUsers() {
  return this.authService.getUsers();
}

@Post('register')
register(@Body() body: any) {
  return this.authService.register(body);
}

@Post('login')
login(@Body() body: any) {
  return this.authService.login(body);
}

@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@Request() req: any) {
  return this.authService.getProfile(req.user.sub)
}


@Get('passenger-test')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PASSENGER')
passengerTest(@Request() req: any) {
  return {
    message: 'Passenger access granted',
    user: req.user,
  };
}

@Get('conductor-test')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CONDUCTOR')
conductorTest(@Request() req: any) {
  return {
    message: 'Conductor access granted',
    user: req.user,
  };
}

@Get('admin-test')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
adminTest(@Request() req: any) {
  return {
    message: 'Admin access granted',
    user: req.user,
  };
}
 


@Post('conductor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
async createConductor(
  @Body() body: any,
  @Request() req: any,
) {
  return this.authService.createConductor(
    body,
    Number(req.user.sub),
  );
}


}
