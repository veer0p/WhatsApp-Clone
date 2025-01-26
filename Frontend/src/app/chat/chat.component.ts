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
  _id: string | null;
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
  lastLoadedMessageId: string | null = null; // Tracks the last loaded message ID
  firstLoadedMessageId: string | null = null; // Tracks the first loaded message ID
  isFetchingMessages: boolean = false; // Prevent overlapping requests

  // Chat footer properties
  message: string = "";
  @Output() sendMessageEvent = new EventEmitter<string>();

  private searchDebounceTimer: any; // Timer for debounce
  isAtBottom: boolean = false; // Track if the user is at the bottom of the chat container
  previousScrollTop: number = 0; // For preserving scroll position

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchInitialMessages();
  }

  ngAfterViewInit() {
    this.scrollToBottom();
    // Add scroll event listener
    this.chatContainer.nativeElement.addEventListener(
      "scroll",
      this.onScroll.bind(this)
    );
  }

  ngOnDestroy() {
    // Clean up event listener when the component is destroyed
    this.chatContainer.nativeElement.removeEventListener(
      "scroll",
      this.onScroll.bind(this)
    );
  }

  onScroll() {
    const chatContainerElement = this.chatContainer.nativeElement;
    const scrollTop = chatContainerElement.scrollTop;
    const scrollHeight = chatContainerElement.scrollHeight;
    const clientHeight = chatContainerElement.clientHeight;

    // Detect if the user is at the bottom
    this.isAtBottom = scrollTop + clientHeight === scrollHeight;

    // Detect when the user is at the top of the chat container
    if (
      scrollTop === 0 &&
      !this.isFetchingMessages &&
      this.lastLoadedMessageId
    ) {
      this.loadOlderMessages();
    }

    // Detect when the user is at the bottom of the chat container
    if (
      scrollTop + clientHeight === scrollHeight &&
      !this.isFetchingMessages &&
      this.firstLoadedMessageId
    ) {
      this.loadNewerMessages();
    }
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(":");
    let hours12 = parseInt(hours, 10);
    const ampm = hours12 >= 12 ? "PM" : "AM";
    hours12 = hours12 % 12;
    if (hours12 === 0) hours12 = 12; // Handle 12 AM/PM
    return `${hours12}:${minutes} ${ampm}`;
  }

  scrollToBottom() {
    if (this.chatContainer?.nativeElement) {
      const container = this.chatContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }

  fetchInitialMessages() {
    this.isFetchingMessages = true;
    this.http.get(`http://localhost:3000/chats?direction=older`).subscribe(
      (response: any) => {
        this.isFetchingMessages = false;
        this.fetchedMessages = response.chats;
        if (this.fetchedMessages.length > 0) {
          this.lastLoadedMessageId = response.lastLoadedMessageId;
          this.firstLoadedMessageId = response.firstLoadedMessageId;
          setTimeout(() => this.scrollToBottom(), 0);
        }
      },
      (error) => {
        this.isFetchingMessages = false;
        console.error("Error fetching messages:", error);
      }
    );
  }

  loadOlderMessages() {
    if (!this.lastLoadedMessageId || this.isFetchingMessages) return;

    // Save the current scroll position before loading older messages
    const chatContainerElement = this.chatContainer.nativeElement;
    const previousScrollTop = chatContainerElement.scrollTop;
    const previousScrollHeight = chatContainerElement.scrollHeight;

    this.isFetchingMessages = true;
    this.http
      .get(
        `http://localhost:3000/chats?lastMessageId=${this.lastLoadedMessageId}&direction=older`
      )
      .subscribe(
        (response: any) => {
          this.isFetchingMessages = false;
          const olderChats = response.chats;
          if (olderChats.length > 0) {
            this.fetchedMessages = [...olderChats, ...this.fetchedMessages];
            this.lastLoadedMessageId = response.lastLoadedMessageId;
          }

          // After loading older messages, restore the scroll position
          setTimeout(() => {
            const newScrollHeight = chatContainerElement.scrollHeight;
            const scrollDelta = newScrollHeight - previousScrollHeight;

            // Adjust the scroll position to maintain the user's relative position
            chatContainerElement.scrollTop = previousScrollTop + scrollDelta;
          }, 0);
        },
        (error) => {
          this.isFetchingMessages = false;
          console.error("Error fetching older messages:", error);
        }
      );
  }

  loadNewerMessages() {
    if (!this.firstLoadedMessageId || this.isFetchingMessages) return;

    // Save the current scroll position before loading newer messages
    const chatContainerElement = this.chatContainer.nativeElement;
    const previousScrollTop = chatContainerElement.scrollTop;
    const previousScrollHeight = chatContainerElement.scrollHeight;

    this.isFetchingMessages = true;
    this.http
      .get(
        `http://localhost:3000/chats?lastMessageId=${this.firstLoadedMessageId}&direction=newer`
      )
      .subscribe(
        (response: any) => {
          this.isFetchingMessages = false;
          const newerChats = response.chats;
          if (newerChats.length > 0) {
            this.fetchedMessages = [...this.fetchedMessages, ...newerChats];
            this.firstLoadedMessageId = response.firstLoadedMessageId;
          }

          // After loading newer messages, restore the scroll position
          setTimeout(() => {
            const newScrollHeight = chatContainerElement.scrollHeight;
            const scrollDelta = newScrollHeight - previousScrollHeight;

            // If the user was at the bottom before loading, scroll to the bottom
            if (
              previousScrollTop + chatContainerElement.clientHeight ===
              previousScrollHeight
            ) {
              chatContainerElement.scrollTop =
                chatContainerElement.scrollHeight;
            } else {
              // Adjust the scroll position to maintain the user's relative position
              chatContainerElement.scrollTop = previousScrollTop + scrollDelta;
            }
          }, 0);
        },
        (error) => {
          this.isFetchingMessages = false;
          console.error("Error fetching newer messages:", error);
        }
      );
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
        this.fetchInitialMessages();
      }
    }, 300); // Delay of 300ms
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

  // Footer methods for sending messages
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
        _id: null,
      });
      setTimeout(() => this.scrollToBottom(), 0); // Scroll after DOM updates
    }
  }
}
