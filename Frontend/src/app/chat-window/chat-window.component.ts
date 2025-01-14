import { Component } from '@angular/core';
import { ChatHeaderComponent } from '../chat-header/chat-header.component';
import { ChatBodyComponent } from '../chat-body/chat-body.component';
import { ChatFooterComponent } from '../chat-footer/chat-footer.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [
    CommonModule,
    ChatHeaderComponent,
    ChatBodyComponent,
    ChatFooterComponent,
  ],
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.css'],
})
export class ChatWindowComponent {
  // Define the messages array
  messages = [
    {
      sender: 'John',
      content: 'Hey there!',
      time: '12:00',
      highlighted: false,
    },
    { sender: 'You', content: 'Hi, John!', time: '12:05', highlighted: false },
  ];

  // Method to add messages
  addMessage(message: string) {
    if (message.trim()) {
      const time = new Date().toLocaleTimeString(); // Add time to the message
      this.messages.push({
        sender: 'You',
        content: message,
        time,
        highlighted: false,
      });
    }
  }

  // Handle the event when the message is sent from the footer component
  onMessageSent(message: string) {
    this.addMessage(message);
  }

  fetchedMessages: any[] = []; // Holds the messages to be displayed

  // Method to handle search results
  onSearchResults(results: any[]): void {
    this.fetchedMessages = results; // Update the fetched messages with search results
  }
}
