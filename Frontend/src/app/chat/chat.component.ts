import {
  Component,
  EventEmitter,
  Output,
  Input,
  ElementRef,
  ViewChild,
  OnInit,
  AfterViewInit,
} from "@angular/core";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { CommonModule } from "@angular/common";

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
  selector: "app-chat",
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.css"],
})
export class ChatComponent implements OnInit, AfterViewInit {
  // Chat header properties
  title: string = "Bn 👻";
  status: string = "Online";
  isSearchActive: boolean = false;
  searchQuery: string = ""; // Holds the current search query
  @Output() searchResults: EventEmitter<any> = new EventEmitter<any>();

  // Chat body properties
  @Input() messages: Message[] = [];
  @ViewChild("chatContainer") chatContainer!: ElementRef;
  fetchedMessages: Chat[] = [];

  // Chat footer properties
  message: string = "";
  @Output() sendMessageEvent = new EventEmitter<string>();

  private searchDebounceTimer: any; // Timer for debounce

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchMessages();
  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(":");
    let hours12 = parseInt(hours, 10);
    const ampm = hours12 >= 12 ? "PM" : "AM";
    hours12 = hours12 % 12;
    if (hours12 === 0) hours12 = 12; // Handle 12 AM/PM
    return `${hours12}:${minutes} ${ampm}`;
  }

  // Methods for header search functionality
  toggleSearch(): void {
    this.isSearchActive = !this.isSearchActive;
    this.searchQuery = "";
    this.searchResults.emit([]); // Emit empty results when search is toggled off
  }

  onSearchChange(event: any): void {
    this.searchQuery = event.target.value;

    // Clear the previous debounce timer
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    // Set a new debounce timer
    this.searchDebounceTimer = setTimeout(() => {
      if (this.searchQuery.trim()) {
        this.searchChats();
      } else {
        this.fetchMessages();
      }
    }, 100); // Delay of 300ms
  }

  searchChats(): void {
    this.http
      .get(`http://localhost:3000/chats/search?q=${this.searchQuery}`)
      .subscribe(
        (response: any) => {
          this.searchResults.emit(response.chats);
          this.fetchedMessages = response.chats;
        },
        (error) => {
          console.error("Error during search:", error);
        }
      );
  }

  // Methods for footer message functionality
  onInputChange(event: any) {
    this.message = event.target.value;
  }

  sendMessage() {
    if (this.message.trim()) {
      this.sendMessageEvent.emit(this.message); // Emit the message to the parent
      this.message = ""; // Clear the input after sending the message
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      this.sendMessage();
    }
  }

  // Handle the event when the message is sent from the footer component
  onMessageSent(message: string) {
    this.addMessage(message);
  }

  addMessage(message: string) {
    if (message.trim()) {
      const time = new Date().toLocaleTimeString();
      this.messages.push({
        sender: "You",
        content: message,
        time,
        highlighted: false,
      });
      setTimeout(() => this.scrollToBottom(), 0); // Scroll after DOM updates
    }
  }

  scrollToBottom() {
    if (this.chatContainer?.nativeElement) {
      const container = this.chatContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }

  fetchMessages() {
    fetch("http://localhost:3000/chats")
      .then((response) => response.json())
      .then((data) => {
        this.fetchedMessages = data.chats;
        this.searchResults.emit([]); // Clear any previous search results
        setTimeout(() => this.scrollToBottom(), 0);
      })
      .catch((error) => console.error("Error fetching messages:", error));
  }
}
