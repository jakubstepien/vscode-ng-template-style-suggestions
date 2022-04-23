import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-inline-component-other',
  template: `
    <p class="">
      inline-component-other works!
    </p>
  `,
  styles: [
    `.inline-component-class-other-one { color: red; }`
  ]
})
export class InlineComponentOtherComponent implements OnInit {
  constructor() { }
  ngOnInit(): void {
  }
}

@Component({
  selector: 'app-inline-component',
  template: `
    <p>
      inline-component works!
    </p>
  `,
  styles: [
    `.inline-component-inline-class{ color: red; }`
  ],
  styleUrls: [
    './inline-component.component.less',
    './another-from-decorator.less'
  ]
})
export class InlineComponentComponent implements OnInit {
  constructor() { }
  ngOnInit(): void {
  }
}