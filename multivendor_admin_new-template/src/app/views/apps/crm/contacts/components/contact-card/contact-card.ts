import { generateInitials } from '@/app/utils/string'
import { Component, Input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { ContactType } from '../../data'

@Component({
  selector: 'app-contact-card',
  imports: [RouterLink, Icon],
  templateUrl: './contact-card.html',
  styles: ``,
})
export class ContactCard {
  @Input() item!: ContactType
  protected readonly generateInitials = generateInitials
}
