import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { InlineComponentComponent } from './inline-component/inline-component.component';
import { RegularComponentComponent } from './regular-component/regular-component.component';

@NgModule({
  declarations: [
    AppComponent,
    InlineComponentComponent,
    RegularComponentComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
