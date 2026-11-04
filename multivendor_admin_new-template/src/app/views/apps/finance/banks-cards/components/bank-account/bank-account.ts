import { toPascalCase } from '@/app/utils/string'
import { Component, inject, TemplateRef } from '@angular/core'
import { Icon } from '@app/components/icon/icon'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { bankAccountData } from '../../data'

@Component({
  selector: 'app-bank-account',
  imports: [Icon],
  templateUrl: './bank-account.html',
  styles: ``,
})
export class BankAccount {
  bankAccountData = bankAccountData
  private modalService = inject(NgbModal)

  openBankModal(content: TemplateRef<any>) {
    this.modalService.open(content, { centered: true })
  }

  protected readonly toPascalCase = toPascalCase
}
