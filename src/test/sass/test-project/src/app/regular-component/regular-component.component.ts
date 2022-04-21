import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-regular-component',
  templateUrl: './regular-component.component.html',
  styleUrls: [
    './regular-component.component.sass',
    './another-from-decorator.sass'
  ],
  styles: [
    `.regular-component-inline-class { color: red; }`
  ]
})
export class RegularComponentComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
