import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TicketWidget } from './ticket-widget'

describe('TicketWidget', () => {
  let component: TicketWidget
  let fixture: ComponentFixture<TicketWidget>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketWidget],
    }).compileComponents()

    fixture = TestBed.createComponent(TicketWidget)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
