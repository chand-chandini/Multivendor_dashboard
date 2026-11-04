import { currentYear, META_DATA } from '@/app/constants'
import { Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { BrandingService } from '@core/services/branding.service'

@Component({
  selector: 'app-maintenance',
  imports: [RouterLink],
  templateUrl: './maintenance.html',
  styles: ``,
})
export class Maintenance {
  protected branding = inject(BrandingService)
  currentYear = currentYear
  name = META_DATA.name
  author = META_DATA.author
}
