/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'; // Import your standalone AppComponent

bootstrapApplication(AppComponent, {
  providers: [provideAnimationsAsync(), provideAnimationsAsync()]
}).catch((err) => console.error(err));
