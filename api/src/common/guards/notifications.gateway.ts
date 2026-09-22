import {
 WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { AuthCookieService } from '../cookies/auth-cookie.service';
import IORedis from 'ioredis';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {

    //handles the socket.io
    @WebSocketServer()
    server!: Server;
private logger = new Logger('NotificationsGateway');
constructor(
  private readonly jwtService: JwtService,
  private readonly cookies: AuthCookieService,
) {}
//allow who is in 
async handleConnection(client: Socket) {
try {
    //verification
const token = this.cookies.get(client.handshake);
if (!token) throw new Error('Missing access token');
const payload = this.jwtService.verify(token);
 client.data.userId = payload.sub;
 //join the connection
await client.join(`user:${payload.sub}`);
this.logger.log(`Client connected: user ${payload.sub}`);
 } catch (err) {
this.logger.warn('Rejected socket — invalid token');
 client.disconnect();
 }
 }
 //disconnect
 handleDisconnect(client: Socket) {
this.logger.log(`Client disconnected: ${client.data?.userId ?? 'unknown'}`);
 }
 //push the function for everyone on the room..
 sendToUser(userId: string, payload: any) {
this.server.to(`user:${userId}`).emit('notification:new', payload);
 }

 //subscribe to redis from the api(single-instances, temporary)
 async onModuleInit() {
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error('REDIS_URL is required');
const sub = new IORedis(redisUrl);
await sub.psubscribe('user:*:notifications');
 sub.on('pmessage', (_pattern, channel, message) => {
const userId = channel.split(':')[1];
this.server.to(`user:${userId}`).emit('notification:new', JSON.parse(message));
 })

}
}
