import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterLink } from '@angular/router'
import { SimplebarAngularModule } from 'simplebar-angular'
import { chatMessageData, chatUser } from '../../data'

@Component({
  selector: 'app-chat',
  imports: [SimplebarAngularModule, RouterLink],
  templateUrl: './chat.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Chat {
  chatMessageData = chatMessageData
  currentUser = chatUser[1]
}
