import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ProAiSidebar } from './pro-ai-sidebar'

describe('ProAiSidebar', () => {
  let component: ProAiSidebar
  let fixture: ComponentFixture<ProAiSidebar>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProAiSidebar],
    }).compileComponents()

    fixture = TestBed.createComponent(ProAiSidebar)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
