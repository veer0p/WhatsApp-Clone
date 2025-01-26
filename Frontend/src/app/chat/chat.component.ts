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
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import {
  NgbDate,
  NgbDatepicker,
  NgbDatepickerModule,
} from "@ng-bootstrap/ng-bootstrap";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import {
  MatDatepicker,
  MatDatepickerModule,
} from "@angular/material/datepicker";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import {
  MatNativeDateModule,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from "@angular/material/core";
import { DateAdapter, NativeDateAdapter } from "@angular/material/core";
import { MatDatepickerInputEvent } from "@angular/material/datepicker";

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

export const MY_DATE_FORMATS = {
  parse: { dateInput: "MM/DD/YYYY" },
  display: {
    dateInput: "MM/DD/YYYY",
    monthYearLabel: "MMM YYYY",
    dateA11yLabel: "LL",
    monthYearA11yLabel: "MMMM YYYY",
  },
};

@Component({
  selector: "app-chat",
  standalone: true,
  imports: [
    CommonModule,
    NgbDatepickerModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_LOCALE, useValue: "en-US" },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
  ],
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.css"],
})
export class ChatComponent implements OnInit, AfterViewInit {
  getFormattedDate(date: any) {
    const d = new Date(date);
    const day = ("0" + d.getDate()).slice(-2); // Adds leading zero to day if less than 10
    const month = ("0" + (d.getMonth() + 1)).slice(-2); // Adds leading zero to month if less than 10
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
  @ViewChild(MatDatepicker) datepicker: MatDatepicker<any> | undefined;

  selectedDate: any = null;
  dateControl: FormControl = new FormControl();

  title: string = "Bn 👻";
  status: string = "Online";
  isSearchActive: boolean = false;
  searchQuery: string = "";
  @Output() searchResults: EventEmitter<any> = new EventEmitter<any>();

  @Input() messages: Message[] = [];
  @ViewChild("chatContainer") chatContainer!: ElementRef;
  fetchedMessages: Chat[] = [];
  lastLoadedMessageId: string | null = null;
  firstLoadedMessageId: string | null = null;
  isFetchingMessages: boolean = false;

  message: string = "";
  @Output() sendMessageEvent = new EventEmitter<string>();

  private searchDebounceTimer: any;
  isAtBottom: boolean = false;
  previousScrollTop: number = 0;
  isCalendarOpen = false;
  calendarControl = new FormControl();

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.fetchInitialMessages();
  }

  sanitizeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  ngAfterViewInit() {
    this.scrollToBottom();
    this.chatContainer.nativeElement.addEventListener(
      "scroll",
      this.onScroll.bind(this)
    );
  }

  ngOnDestroy() {
    this.chatContainer.nativeElement.removeEventListener(
      "scroll",
      this.onScroll.bind(this)
    );
  }

  onDateChange(event: MatDatepickerInputEvent<Date>) {
    if (event.value) {
      // Ensure the selected date is set to midnight (local timezone)
      const localDate = event.value;
      this.selectedDate = new Date(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate(),
        0,
        0,
        0
      );

      console.log("Selected Date:", this.selectedDate);

      // Trigger search after date selection
      this.searchChats();
    }
  }

  openCalendar() {
    if (this.datepicker) {
      this.datepicker.open();
    }
  }

  onScroll() {
    const chatContainerElement = this.chatContainer.nativeElement;
    const scrollTop = chatContainerElement.scrollTop;
    const scrollHeight = chatContainerElement.scrollHeight;
    const clientHeight = chatContainerElement.clientHeight;

    this.isAtBottom = scrollTop + clientHeight === scrollHeight;

    if (
      scrollTop === 0 &&
      !this.isFetchingMessages &&
      this.lastLoadedMessageId
    ) {
      // this.loadOlderMessages();
    }

    if (
      scrollTop + clientHeight === scrollHeight &&
      !this.isFetchingMessages &&
      this.firstLoadedMessageId
    ) {
      // this.loadNewerMessages();
    }
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(":");
    let hours12 = parseInt(hours, 10);
    const ampm = hours12 >= 12 ? "PM" : "AM";
    hours12 = hours12 % 12 || 12;
    return `${hours12}:${minutes} ${ampm}`;
  }

  scrollToBottom() {
    const container = this.chatContainer?.nativeElement;
    if (container) {
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
          setTimeout(() => {
            const newScrollHeight = chatContainerElement.scrollHeight;
            chatContainerElement.scrollTop =
              previousScrollTop + (newScrollHeight - previousScrollHeight);
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

    const chatContainerElement = this.chatContainer.nativeElement;

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
        },
        (error) => {
          this.isFetchingMessages = false;
          console.error("Error fetching newer messages:", error);
        }
      );
  }

  toggleSearch(): void {
    this.isSearchActive = !this.isSearchActive;

    if (!this.isSearchActive) {
      // Reset search query and selected date
      this.searchQuery = "";
      this.selectedDate = null;

      // Emit an empty search result to clear the current view
      this.searchResults.emit([]);

      // Fetch initial messages to reset the chat
      this.fetchInitialMessages();
    }
  }

  searchChats(): void {
    const formattedDate = this.selectedDate
      ? this.selectedDate.toISOString().split("T")[0] // Only the date part (YYYY-MM-DD)
      : null;

    let apiUrl = `http://localhost:3000/chats/search?`;
    if (this.searchQuery) {
      apiUrl += `q=${encodeURIComponent(this.searchQuery)}&`;
    }
    if (formattedDate) {
      apiUrl += `startDate=${formattedDate}`;
    }

    this.http.get(apiUrl).subscribe(
      (response: any) => {
        // Handle response with lastLoadedMessageId and firstLoadedMessageId
        this.searchResults.emit(response.chats);
        this.fetchedMessages = response.chats;

        if (response.lastLoadedMessageId) {
          this.lastLoadedMessageId = response.lastLoadedMessageId;
        }
        if (response.firstLoadedMessageId) {
          this.firstLoadedMessageId = response.firstLoadedMessageId;
        }

        console.log("Search Results:", response);
      },
      (error) => {
        console.error("Error during search:", error);
      }
    );
  }

  onSearchChange(event: any): void {
    this.searchQuery = event.target.value;

    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);

    this.searchDebounceTimer = setTimeout(() => {
      if (this.searchQuery.trim() || this.selectedDate) {
        this.searchChats();
      } else {
        this.fetchInitialMessages();
      }
    }, 300);
  }

  onInputChange(event: any) {
    this.message = event.target.value;
  }

  sendMessage() {
    if (this.message.trim()) {
      this.sendMessageEvent.emit(this.message);
      this.message = "";
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      this.sendMessage();
    }
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
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }
}
