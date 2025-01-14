import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatMessageComponent } from './chat-message/chat-message.component';
import { ChatWindowComponent } from './chat-window/chat-window.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChatMessageComponent, ChatWindowComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'Frontend';
}
