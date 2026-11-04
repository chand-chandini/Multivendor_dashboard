import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap'
import { channelData } from '../../data'

@Component({
  selector: 'app-channels',
  imports: [NgbProgressbarModule],
  templateUrl: './channels.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Channels {
  channelData = channelData
}
