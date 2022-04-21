import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-regular-component',
  templateUrl: './regular-component.component.html',
  styleUrls: [
    './regular-component.component.css',
    './another-from-decorator.css'
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
