import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component'; // Import your standalone AppComponent

bootstrapApplication(AppComponent).catch((err) => console.error(err));
