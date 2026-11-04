import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ProjectsPerformance } from './projects-performance'

describe('ProjectsPerformance', () => {
  let component: ProjectsPerformance
  let fixture: ComponentFixture<ProjectsPerformance>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsPerformance],
    }).compileComponents()

    fixture = TestBed.createComponent(ProjectsPerformance)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
