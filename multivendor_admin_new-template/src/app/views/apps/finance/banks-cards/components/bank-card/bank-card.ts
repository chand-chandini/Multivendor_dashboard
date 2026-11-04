import { toPascalCase } from '@/app/utils/string'
import { Component, inject, TemplateRef } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { FlatpickrDirective } from 'angularx-flatpickr'
import { paymentCardData } from '../../data'

@Component({
  selector: 'app-bank-card',
  imports: [RouterLink, Icon, NgbDropdownModule, FlatpickrDirective],
  templateUrl: './bank-card.html',
  styles: ``,
})
export class BankCard {
  paymentCardData = paymentCardData

  flatPickrOptions = {
    dateFormat: 'M, Y',
    defaultDate: new Date(),
    monthSelectorType: 'dropdown' as const,
  }

  private modalService = inject(NgbModal)

  openBankModal(content: TemplateRef<any>) {
    this.modalService.open(content, { centered: true })
  }

  protected readonly toPascalCase = toPascalCase
}
