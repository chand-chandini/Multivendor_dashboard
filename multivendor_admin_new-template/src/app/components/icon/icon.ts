import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core'

@Component({
  selector: 'app-icon',
  imports: [],
  templateUrl: './icon.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Icon {
  @Input({ required: true }) icon!: string
  @Input() prefix: string = 'tabler:'
  @Input() size?: string
  @Input() color?: string
  @Input() class?: string

  get fullIcon(): string {
    // Icons that already carry an Iconify collection (e.g. "ri:store-2-fill",
    // as produced from the module tables) are used as-is.
    return this.icon.includes(':') ? this.icon : this.prefix + this.icon
  }
}
