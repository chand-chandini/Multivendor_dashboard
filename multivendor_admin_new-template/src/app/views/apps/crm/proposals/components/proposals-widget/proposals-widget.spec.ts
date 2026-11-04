import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ProposalsWidget } from './proposals-widget'

describe('ProposalsWidget', () => {
  let component: ProposalsWidget
  let fixture: ComponentFixture<ProposalsWidget>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProposalsWidget],
    }).compileComponents()

    fixture = TestBed.createComponent(ProposalsWidget)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
