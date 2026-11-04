import { currentYear, META_DATA } from '@/app/constants'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="container-fluid">
        <div class="row">
          <div class="col-md-6 text-center text-md-start">
            {{ currentYear }}
            © {{ name }} - By
            <span class="fw-bold text-decoration-underline text-uppercase text-reset fs-12">{{ author }}</span>
          </div>
          <div class="col-md-6">
            <div class="d-none d-md-flex justify-content-end gap-3">
              <a [routerLink]="[]" class="link-reset">About</a>
              <a [routerLink]="[]" class="link-reset">Support</a>
              <a [routerLink]="[]" class="link-reset">Contact Us</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `,
})
export class Footer {
  currentYear = currentYear
  name = META_DATA.name
  author = META_DATA.author
}
