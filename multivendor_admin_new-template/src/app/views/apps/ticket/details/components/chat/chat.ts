import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { SimplebarAngularModule } from 'simplebar-angular'
const user1 = 'assets/images/users/user-5.jpg'
const user2 = 'assets/images/users/user-2.jpg'

@Component({
  selector: 'app-chat',
  imports: [Icon, RouterLink, SimplebarAngularModule],
  templateUrl: './chat.html',
  styles: ``,
})
export class Chat {
  userData = [
    { name: 'Carlos Méndez', image: user1 },
    { name: 'Sophie Laurent', image: user2 },
  ]

  currentuser = this.userData[0]
  currentUser = this.userData[1]

  messageData = [
    {
      message: 'Hey! Are you available for a quick call? 📞',
      time: '08:55 am',
      user: this.userData[0],
    },
    {
      message: 'Sure, give me 5 minutes. Just wrapping something up.',
      time: '08:57 am',
      user: this.currentUser,
    },
    {
      message: "Perfect. Let me know when you're ready 👍",
      time: '08:58 am',
      user: this.userData[0],
    },
    {
      message: 'Ready now. Calling you!',
      time: '09:00 am',
      user: this.currentUser,
    },
    {
      message: 'Thanks for your time earlier!',
      time: '09:45 am',
      user: this.userData[0],
    },
    {
      message: 'Of course! It was a productive discussion.',
      time: '09:46 am',
      user: this.currentUser,
    },
    {
      message: 'I’ll send over the updated files by noon.',
      time: '09:50 am',
      user: this.userData[0],
    },
  ]
}
