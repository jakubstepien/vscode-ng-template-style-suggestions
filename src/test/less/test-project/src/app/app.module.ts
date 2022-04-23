import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { RegularComponentComponent } from './regular-component/regular-component.component';
import { InlineComponentComponent } from './inline-component/inline-component.component';

@NgModule({
  declarations: [
    AppComponent,
    RegularComponentComponent,
    InlineComponentComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
