import { currentYear, META_DATA } from '@/app/constants'
import { Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { BrandingService } from '@core/services/branding.service'
@Component({
  selector: 'app-error-403',
  imports: [RouterLink],
  templateUrl: './error-403.html',
  styles: ``,
})
export class Error403 {
  protected branding = inject(BrandingService)
  currentYear = currentYear
  name = META_DATA.name
  author = META_DATA.author
}
