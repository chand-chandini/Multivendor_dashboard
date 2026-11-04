import { currentYear, META_DATA } from '@/app/constants'
import { Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { BrandingService } from '@core/services/branding.service'

@Component({
  selector: 'app-error-500',
  imports: [RouterLink],
  templateUrl: './error-500.html',
  styles: ``,
})
export class Error500 {
  protected branding = inject(BrandingService)
  currentYear = currentYear
  name = META_DATA.name
  author = META_DATA.author
}
