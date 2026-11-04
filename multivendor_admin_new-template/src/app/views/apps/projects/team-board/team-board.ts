import { Component, inject, TemplateRef } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { TeamBoardCard } from './components/team-board-card/team-board-card'
import { teamData } from './data'

@Component({
  selector: 'app-team-board',
  imports: [Icon, RouterLink, TeamBoardCard],
  templateUrl: './team-board.html',
  styles: ``,
})
export class TeamBoard {
  teamData = teamData

  private modalService = inject(NgbModal)

  openModal(content: TemplateRef<any>) {
    this.modalService.open(content, { centered: true })
  }
}
