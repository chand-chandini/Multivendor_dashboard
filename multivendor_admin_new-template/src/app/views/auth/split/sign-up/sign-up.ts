import { currentYear, META_DATA } from '@/app/constants'
import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { PasswordStrengthBar } from '@app/components/password-strength-bar/password-strength-bar'

@Component({
  selector: 'app-sign-up',
  imports: [FormsModule, PasswordStrengthBar, Icon, RouterLink],
  templateUrl: './sign-up.html',
  styles: ``,
})
export class SignUp {
  currentYear = currentYear
  name = META_DATA.name
  author = META_DATA.author
  username = META_DATA.username
  password: string = ''
}
