import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-inline-component',
  template: `
    <p>
      inline-component works!
    </p>
  `,
  styles: [
    `.inline-component-class { color: red; }`
  ]
})
export class InlineComponentComponent implements OnInit {
  constructor() { }
  ngOnInit(): void {
  }
}

@Component({
  selector: 'app-inline-component2',
  template: `
    <p>
      inline-component2 works!
    </p>
  `,
  styles: [
    `.inline-component-class2 { color: red; }`
  ]
})
export class InlineComponentComponent2 implements OnInit {
  constructor() { }
  ngOnInit(): void {
  }
}