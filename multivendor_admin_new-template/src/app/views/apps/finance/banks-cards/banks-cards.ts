import { Component } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { BankAccount } from './components/bank-account/bank-account'
import { BankCard } from './components/bank-card/bank-card'

@Component({
  selector: 'app-banks-cards',
  imports: [PageBreadcrumb, BankAccount, BankCard],
  templateUrl: './banks-cards.html',
  styles: ``,
})
export class BanksCards {}
