import { ComponentFixture, TestBed } from '@angular/core/testing'
import { CampaignWidget } from './campaign-widget'

describe('CampaignWidget', () => {
  let component: CampaignWidget
  let fixture: ComponentFixture<CampaignWidget>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampaignWidget],
    }).compileComponents()

    fixture = TestBed.createComponent(CampaignWidget)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
