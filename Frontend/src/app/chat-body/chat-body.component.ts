import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Message {
  sender: string | null;
  content: string;
  time: string;
  highlighted: boolean;
}

interface Chat {
  date: string;
  messages: Message[];
}

@Component({
  selector: 'app-chat-body',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-body.component.html',
  styleUrls: ['./chat-body.component.css'],
})
export class ChatBodyComponent implements OnInit {
  @Input() messages: Message[] = []; // This will receive the messages from the parent component

  fetchedMessages: Chat[] = []; // This holds the chat data with messages

  constructor() {}

  ngOnInit() {
    // Call the API when the component is initialized
    this.fetchMessages();
  }

  // Convert time to 12-hour format (AM/PM)
  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    let hours12 = parseInt(hours, 10);
    const ampm = hours12 >= 12 ? 'PM' : 'AM';
    hours12 = hours12 % 12;
    if (hours12 === 0) hours12 = 12; // Handle 12 AM/PM
    return `${hours12}:${minutes} ${ampm}`;
  }

  // Fetch messages from the API
  fetchMessages() {
    debugger;
    fetch('http://localhost:3000/chats')
      .then((response) => response.json())
      .then((data) => {
        this.fetchedMessages = data.chats; // Assign the chat data to fetchedMessages
      })
      .catch((error) => console.error('Error fetching messages:', error));
    console.log(this.fetchMessages);
  }
}
