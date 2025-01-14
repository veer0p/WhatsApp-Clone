import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-chat-header',
  imports: [CommonModule, HttpClientModule],
  templateUrl: './chat-header.component.html',
  styleUrls: ['./chat-header.component.css'],
})
export class ChatHeaderComponent {
  title: string = 'Bn 👻';
  status: string = 'Online';
  isSearchActive: boolean = false;
  searchQuery: string = ''; // Holds the current search query

  @Output() searchResults: EventEmitter<any> = new EventEmitter<any>();

  constructor(private http: HttpClient) {}

  toggleSearch(): void {
    this.isSearchActive = !this.isSearchActive;
    this.searchQuery = '';
    this.searchResults.emit([]); // Emit empty results when search is toggled off
  }

  onSearchChange(event: any): void {
    this.searchQuery = event.target.value;

    if (this.searchQuery.trim()) {
      this.searchChats();
    } else {
      this.searchResults.emit([]); // Emit empty results if the query is cleared
    }
  }

  searchChats(): void {
    this.http
      .get(`http://localhost:3000/chats/search?q=${this.searchQuery}`)
      .subscribe(
        (response: any) => {
          this.searchResults.emit(response.chats); // Emit the search results to the parent
        },
        (error) => {
          console.error('Error during search:', error);
        }
      );
  }
}
