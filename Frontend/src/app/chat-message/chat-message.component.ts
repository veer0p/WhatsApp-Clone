import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-chat-message',
  standalone: true, // Mark it as standalone
  templateUrl: './chat-message.component.html',
  styleUrls: ['./chat-message.component.css'],
  imports: [CommonModule],
})
export class ChatMessageComponent {
  @Input() message!: { user: string; text: string }; // Correctly declare @Input
}
