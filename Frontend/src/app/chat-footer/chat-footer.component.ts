import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-chat-footer',
  templateUrl: './chat-footer.component.html',
  styleUrls: ['./chat-footer.component.css'],
})
export class ChatFooterComponent {
  message: string = ''; // Holds the input value

  @Output() sendMessageEvent = new EventEmitter<string>(); // EventEmitter to notify parent component

  // Method to handle message input change
  onInputChange(event: any) {
    this.message = event.target.value;
  }

  // Method to send the message
  sendMessage() {
    if (this.message.trim()) {
      this.sendMessageEvent.emit(this.message); // Emit the message to the parent
      this.message = ''; // Clear the input after sending the message
    }
  }

  // Method to listen for Enter key press
  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }
}
